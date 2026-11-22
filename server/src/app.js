// App assembly lives here so tests can mount it without starting a listener.
import express from "express";
import cors from "cors";

import auditLogRoutes from "./routes/audit-log-routes.js";
import authRoutes from "./routes/auth-routes.js";
import driverRoutes from "./routes/driver-routes.js";
import efficiencyRoutes from "./routes/efficiency-routes.js";
import fuelLogRoutes from "./routes/fuel-log-routes.js";
import managerRoutes from "./routes/manager-routes.js";
import orderRoutes from "./routes/order-routes.js";
import routeRoutes from "./routes/route-routes.js";
import tripRoutes from "./routes/trip-routes.js";
import vehicleRoutes from "./routes/vehicle-routes.js";

const app = express();

// --- MIDDLEWARE ---
app.use(express.json());
app.use(
    cors({
        origin: process.env.ORIGIN_URI,
    }),
);

// Unauthenticated liveness probe (CI readiness checks). `commit` lets the deploy
// job confirm Render is serving the new build; Render sets RENDER_GIT_COMMIT.
app.get("/health", (req, res) =>
    res.json({ status: "ok", commit: process.env.RENDER_GIT_COMMIT ?? null }),
);
app.use("/api/audit_log", auditLogRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/efficiency", efficiencyRoutes);
app.use("/api/fuel_logs", fuelLogRoutes);
app.use("/api/managers", managerRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/routes", routeRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/vehicles", vehicleRoutes);

export default app;
