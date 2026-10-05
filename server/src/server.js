import "../env.js";

// Import routes AFTER dotenv.config() so environment variables are loaded
import express from "express";
import cors from "cors";

import managerRoutes from "./routes/manager-routes.js";
import routeRoutes from "./routes/route-routes.js";
import authRoutes from "./routes/auth-routes.js";
import tripRoutes from "./routes/trip-routes.js";
import driverRoutes from "./routes/driver-routes.js";
import orderRoutes from "./routes/order-routes.js";
import fuelLogRoutes from "./routes/fuel-log-routes.js";
import efficiencyRoutes from "./routes/efficiency-routes.js";
import vehicleRoutes from "./routes/vehicle-routes.js";

import { startSyncScheduler } from "./services/sync-service.js";

const app = express();
const PORT = process.env.PORT || 8080;

// --- MIDDLEWARE ---
app.use(express.json());
app.use(
    cors({
        origin: process.env.ORIGIN_URI,
    }),
);

app.use("/api/managers", managerRoutes);
app.use("/api/routes", routeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/fuel_logs", fuelLogRoutes);
app.use("/api/efficiency", efficiencyRoutes);
app.use("/api/vehicles", vehicleRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log("Ctrl + C to stop server.");
    startSyncScheduler();
});
