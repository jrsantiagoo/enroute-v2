-- Training rows for the smart notification models: one row per usable completed trip in the last 180 days.
-- Run in the Supabase SQL editor and export the result as trips.csv, or let train.py run it with --db-url.
-- A trip counts as usable when it has departed_at and completed_at and at least one stop.
SELECT
    t.id_::text AS trip_id,
    to_char(t.departed_at AT TIME ZONE 'Asia/Manila', 'YYYY-MM-DD') AS date,
    EXTRACT(dow FROM t.departed_at AT TIME ZONE 'Asia/Manila')::int AS dow,
    EXTRACT(hour FROM t.departed_at AT TIME ZONE 'Asia/Manila')
        + EXTRACT(minute FROM t.departed_at AT TIME ZONE 'Asia/Manila') / 60.0 AS depart_hour,
    COALESCE(NULLIF(oc.n, 0), sc.n, 0) AS stops,
    EXTRACT(epoch FROM (t.completed_at - t.departed_at)) / 60.0 AS duration_min,
    (t.completed_at AT TIME ZONE 'Asia/Manila')
        > ((t.departed_at AT TIME ZONE 'Asia/Manila')::date + time '18:00') AS late,
    w.precip_mm
FROM trip t
LEFT JOIN LATERAL (SELECT count(*)::int AS n FROM "order" o WHERE o.trip_id_ = t.id_) oc ON true
LEFT JOIN LATERAL (SELECT count(*)::int AS n FROM stop s WHERE s.route_id_ = t.route_id_) sc ON true
LEFT JOIN "DailyWeather" w ON w.date = (t.departed_at AT TIME ZONE 'Asia/Manila')::date
WHERE t.status = 'COMPLETED'
  AND t.deleted_at IS NULL
  AND t.departed_at IS NOT NULL
  AND t.completed_at IS NOT NULL
  AND t.completed_at > t.departed_at
  AND t.completed_at >= now() - interval '180 days'
ORDER BY t.departed_at;
