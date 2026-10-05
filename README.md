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
