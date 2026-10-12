import "../env.js";

// Import the app AFTER dotenv.config() so environment variables are loaded
import app from "./app.js";
import { startSyncScheduler } from "./services/sync-service.js";

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log("Ctrl + C to stop server.");
    startSyncScheduler();
});

