# Smart notification models: training, registry and monitoring

Two small linear models learn from your completed trips (see "The models"). Around them sit three pieces of MLOps, sized for models this small.

| Piece | What it does | Where |
|---|---|---|
| Retraining | Monthly GitHub Action trains on fresh trips, opens a pull request with the new `model.json`, and registers the run as a candidate | `.github/workflows/retrain-smart-notification-models.yml`, `ml/train.py` |
| Registry | One `ModelRun` row per training run (scores, trip count, the model itself). One row is `active`. Promote and roll back without a redeploy | `ml/registry.py`, `ml/promote.py` |
| Monitoring | The server records each prediction in `PredictionLog`. A daily job fills in what really happened, scores the live model against a plain average, and switches off a part that is worse | `ml/monitor.py`, `.github/workflows/monitor-smart-notification-models.yml` |

## One-time setup

1. Create the tables with Prisma: append `server/schema.mlops.additions.prisma` to `schema.prisma`, run `npx prisma migrate dev --name add_mlops_tables` and `npx prisma generate`, then enable RLS on both tables (`sql/mlops-tables.sql` shows the same columns for reference). The server needs the generated client to read the registry and record predictions; until then it uses `model.json` and skips recording.
2. The retrain and monitor workflows use the `DIRECT_URL` secret of the `production` environment (the Supabase session-pooler URL), so no new secret is needed. For anything beyond a class project, create a dedicated database user that can read `trip`, `order`, `stop`, `DailyWeather` and `KnownEvent` and read and write `ModelRun` and `PredictionLog`, and use that URL instead.
3. Locally: `cd ml && pip install -r requirements.txt`.

## Everyday use

```
python train.py --db-url "$DIRECT_URL" --register     # train, write model.json, record a candidate
python promote.py --db-url "$DIRECT_URL" --list        # see every run and its scores
python promote.py --db-url "$DIRECT_URL" --latest --write-file   # make the newest candidate live
python promote.py --db-url "$DIRECT_URL" --rollback    # go back to the previous model
python monitor.py --db-url "$DIRECT_URL"               # accuracy report (the Action runs this daily)
```

Promoting or rolling back takes effect within an hour (the server rechecks the registry hourly), and notifications cached from the old model are replaced immediately. With no active registry row the server uses the committed `model.json`; with neither, everything runs on plain statistics.

No database access from Python? Train from CSV exports instead (`training-data.sql`, then `python train.py --trips trips.csv --events events.csv`). That skips the registry.

## The models

| Model | Predicts | Used by |
|---|---|---|
| pace (Ridge) | minutes per stop | the 6 PM cutoff card |
| late (logistic) | chance a trip finishes after 6 PM | the "Trips may run late" card, which replaces the weekday-pattern card |

Inputs: weekday, forecast rainfall, a rainy-day flag, holiday or event day, number of stops, departure time. Live traffic is not an input (there is no traffic history); the cutoff card still multiplies by current traffic. Both models are linear so the server scores them in plain JavaScript and every prediction can be explained.

## Safety checks, in order

1. **Before training counts:** a model is usable only with at least 60 trips, and only if it beats a plain average by 5% or more on trips it has not seen (time-ordered folds). The late model also needs 10 late and 10 on-time trips. `model.json` records why a part was rejected.
2. **Before going live:** `promote.py` refuses a rejected model unless you pass `--force`.
3. **After going live:** `monitor.py` compares predictions with what happened. After 14 days and 30 trips it judges each part. A part worse than the plain average is switched off with `--auto-disable` (the Action does this), the cards fall back to statistics, and an issue is opened with the report, including a calibration table (when it said 60-80%, how often was it right).

## What this deliberately does not include

- **A model serving service (FastAPI).** The rules are synchronous and the models are a few coefficients, so scoring in the Express process is simpler and has nothing extra to deploy or monitor. Worth adding if you move to tree models or neural networks.
- **A feature store.** `ml/features.py` is the single place features are defined for training and monitoring, and `model.json` carries the feature order for the server. A feature store pays off with many models sharing features.
- **Experiment tracking tools (MLflow and similar).** The `ModelRun` table already records each run's scores, data range and trip count.

## Tests

```
cd ml && python -m pytest -q tests                                  # unit tests
TEST_DATABASE_URL=postgresql://... python -m pytest -q tests        # also the registry and monitor against Postgres (uses a throwaway schema)
cd server && npx vitest run
```

Do not commit or promote a model trained on the demo data. It only knows the patterns the demo seed contains.
