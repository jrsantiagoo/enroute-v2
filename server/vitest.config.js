import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "node",
        include: ["tests/**/*.test.js"],
        // dummy values so supabase-client.js can be imported without a real .env
        env: {
            SUPABASE_URL: "https://test-project.supabase.co",
            SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
            ORIGIN_URI: "http://localhost:3000",
        },
        // Only used by `npm run test:coverage`. Untested files in src/ count as 0%, so the total is honest.
        coverage: {
            provider: "v8",
            include: ["src/**/*.js"],
            exclude: ["src/generated/**"],
            reporter: ["text", "json-summary"],
        },
    },
});
