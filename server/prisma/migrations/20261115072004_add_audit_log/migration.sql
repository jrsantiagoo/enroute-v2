-- CreateTable
CREATE TABLE "audit_log" (
    "id" BIGSERIAL NOT NULL,
    "table_name" TEXT NOT NULL,
    "record_id" TEXT,
    "action" TEXT NOT NULL,
    "old_data" JSONB,
    "new_data" JSONB,
    "actor_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_log_table_name_record_id_idx" ON "audit_log"("table_name", "record_id");

-- CreateIndex
CREATE INDEX "audit_log_created_at_idx" ON "audit_log"("created_at");

ALTER TABLE "audit_log" ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.log_audit() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Skip no-op updates (e.g. sync job rewriting identical rows)
  IF TG_OP = 'UPDATE'
     AND (to_jsonb(NEW) - 'updated_at') = (to_jsonb(OLD) - 'updated_at') THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.audit_log (table_name, record_id, action, old_data, new_data, actor_id)
  VALUES (
    TG_TABLE_NAME,
    COALESCE(to_jsonb(NEW)->>'id_', to_jsonb(OLD)->>'id_'),
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) END,
    NULLIF(current_setting('app.user_id', true), '')::uuid
  );
  RETURN COALESCE(NEW, OLD);
END $$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'manager','route','stop','agent_profile','vehicle_make',
    'vehicle_model','vehicle','trip','order','fuel_log'
  ]
  LOOP
    EXECUTE format(
      'CREATE TRIGGER %I AFTER INSERT OR UPDATE OR DELETE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.log_audit()',
      'audit_' || t, t);
  END LOOP;
END $$;