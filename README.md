# EnRoute

Welcome to the **EnRoute**, a web application that helps logistics managers efficiently plan, schedule, monitor, and assign delivery operations. The platform centralizes route planning, trip assignment, fleet management, fuel tracking, and order monitoring in one streamlined system.

---

## Features

- **Route Planning** – Create, edit, reorder, and archive routes with drag-and-drop stop ordering, suggested routes, and saved routes.
- **Trip Management** – Assign drivers and vehicles to trips, track status (Pending → Processing → Completed/Failed/Cancelled), update and archive trips.
- **Fleet Management** – Manage vehicles with make/model/type dropdowns, plates, capacities, odometer readings, registration and insurance details.
- **Fuel & Efficiency Tracking** – Record fuel logs and monitor km/L, cost per km, variance, and attention flags.
- **Order Tracking** – Track orders tied to trips with package details and delivery status.
- **Assignment Views** – Calendar, table, and driver views for managing trip assignments.
- **Dashboard** – Statistics and charts (Recharts) over a selectable date range, with PDF export.

---

## Getting Started

### Prerequisites

- Node.js
- npm
- PostgreSQL database (with `DATABASE_URL` / `DIRECT_URL`)
- Supabase Project (for auth)

### Environment Variables

**Server:** `./server/.env`
| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `DIRECT_URL` | Direct PostgreSQL URL (for migrations) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (for auth) |
| `CORE_API` | External core API endpoint |
| `LOGISTICS_API` | Logistics API endpoint |
| `CLIENT_EMAIL` / `CLIENT_PASSWORD` / `CLIENT_TENANT_CODE` | Sync credentials |
| `ORIGIN_URI` | Allowed CORS origin |

**Client:** `./client/.env.local`
| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL |

### Install and Run

1. Install Dependencies

```bash
npm run install-server
npm run install-client
```

2. Run Development Server

```bash
npm run server
```

3. Run Development Client Server

```bash
npm run client
```

4. Access the App

- Frontend: http://localhost:3000
- Backend API: http://localhost:8080

---

## Tech Stack

### Frontend

| Category            | Technology         |
| ------------------- | ------------------ |
| Framework           | Next.js 16         |
| Language            | TypeScript         |
| Routing             | Next.js App Router |
| Styling             | Tailwind CSS 4     |
| Data Fetching       | Fetch API          |
| Client Global State | React `useState`   |
| Code Formatter      | Prettier           |
| Code Quality        | ESLint             |

### Backend API

| Category            | Technology            |
| ------------------- | --------------------- |
| Language            | JavaScript            |
| Runtime Environment | Node.js               |
| Web Framework       | Express.js            |
| Package Manager     | npm                   |
| Database            | PostgreSQL / Supabase |
| ORM                 | Prisma 6              |
| Authentication      | Supabase Auth         |
| Code Formatter      | Prettier              |
| Code Quality        | ESLint                |

## Mapping & Routing

| Category         | Technology                         |
| ---------------- | ---------------------------------- |
| Map Rendering    | Leaflet.js + react-leaflet         |
| Map Tile Imagery | OpenStreetMap                      |
| Routing Engine   | Open Source Routing Machine (OSRM) |

---

## Project Structure

```text
project-root/
├── client/                      # Next.js frontend
│   ├── app/                     # App Router pages (dashboard, assignment, fleet, route-tool, auth)
│   ├── components/              # UI and feature components
│   └── lib/
├── server/                      # Express backend
│   ├── src/
│   │   ├── controllers/         # Request handlers
│   │   ├── routes/              # API route definitions
│   │   ├── services/            # Business logic (incl. sync-service)
│   │   ├── middleware/          # Auth middleware
│   │   ├── lib/                 # Prisma & Supabase clients
│   │   └── generated/           # Generated Prisma client
│   ├── prisma/                  # Schema & migrations
│   ├── scripts/                 # Seed scripts
│   └── env.js
├── package.json                 # Root scripts
└── README.md
```

---

## Deployment

This project uses a split deployment architecture:

| Service            | Platform |
| ------------------ | -------- |
| Frontend (Next.js) | Vercel   |
| Backend (Express)  | Render   |
| Database           | Supabase |

---

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`) runs on every pull request and on pushes to `dev` and `main`.

| Job | Runs on | Checks |
| --- | --- | --- |
| `server` | PRs, `dev`, `main` | Vitest suite, `prisma validate`, migrations apply to an empty Postgres, `schema.prisma` matches the migrations (drift), server boots (`/health`) |
| `client` | PRs, `dev`, `main` | ESLint, typed production build |
| `e2e (chromium)`, `e2e (firefox)` | PRs | Playwright suite against a throwaway local Supabase (migrated + seeded per run) |
| `deploy` | `main` | Runs after `server` and `client` pass, in the `production` environment |

The `deploy` job does two things:

1. It applies pending Prisma migrations to the production database.
2. It triggers Render's deploy hook for that exact commit.

Vercel promotes the production frontend only after `server`, `client` and `deploy` pass.

> Schema changes always need a migration (`npx prisma migrate dev --name <change>`). The drift check fails the build when `schema.prisma` and `prisma/migrations` disagree.

### One-time setup (in this order)

1. **Render:** in the backend service's settings:
   - Confirm the branch is `main`.
   - Confirm `NODE_VERSION` is at least 22.18. The server imports the generated `.ts` Prisma client directly.
   - Set **Auto-Deploy** to **Off**.
   - Copy the **Deploy Hook** URL.
2. **GitHub (repo owner):** in Settings → Environments, create `production`:
   - Under **Deployment branches and tags**, choose **Selected branches and tags** and add `main`.
   - Add these environment secrets:
     - `DIRECT_URL`: the Supabase session-pooler connection string (same as `server/.env`).
     - `RENDER_DEPLOY_HOOK_URL`: the URL from step 1.
   - Do not also store them as repository secrets. Any branch's workflow can read repository secrets.

   Recommended: protect `main` and `dev` with the required checks `server`, `client`, `e2e (chromium)` and `e2e (firefox)`.
3. Merge to `main`. The first run creates the `deploy` check.
4. **Vercel:** in Settings → Deployment Checks, require `server`, `client` and `deploy`. Require all three: when `server` or `client` fails, `deploy` is skipped rather than failed.

If a secret is missing, the `deploy` job fails with a message naming it. Nothing is deployed until the secret is added.

### Running e2e locally

This needs Docker. From the repo root:

```bash
npm ci && npx supabase start                                  # local auth + Postgres
cd server && npx prisma migrate deploy && npm run seed:test -- --yes
SEED_MANAGER_EMAIL=... SEED_MANAGER_PASSWORD=... node scripts/seed-manager.js
```

Point `server/.env` and `client/.env.local` at the local stack, start both apps, then run `npm run test:e2e` with matching `TEST_MANAGER_EMAIL` and `TEST_MANAGER_PASSWORD`. Never run `seed:test` against production: it wipes trips, routes, orders, fuel logs and drivers.

### If a production migration fails

The failed migration is rolled back automatically, but Prisma marks it as failed. Until it is resolved, every later deploy stops. From `server/` with the production `.env`:

```bash
npx prisma migrate resolve --rolled-back <migration_name>
```

Then fix the migration in a new commit and merge it again.
