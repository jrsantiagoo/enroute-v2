import { DEFAULT_MODEL_PATH, isValidModel, loadModel } from "./model-scorer.js";

const REFRESH_MS = 60 * 60 * 1000;
const RETRY_MS = 5 * 60 * 1000;

// Finds the model to use: the active row in the ModelRun registry first, then the model.json committed with the code, then none.
// Promoting or rolling back a model in the registry therefore takes effect within an hour, with no redeploy.
// Any failure here (tables not migrated yet, database hiccup) falls back to the file and is retried in 5 minutes.
export function createModelSource({
    prisma,
    filePath = DEFAULT_MODEL_PATH,
    clock = () => Date.now(),
}) {
    let cached = null;
    let checkedAt = 0;
    let nextCheckMs = 0;

    async function readRegistry() {
        if (!prisma?.modelRun) return null;
        const row = await prisma.modelRun.findFirst({
            where: { status: "active" },
            orderBy: { promoted_at: "desc" },
            select: { artifact: true },
        });
        return row && isValidModel(row.artifact) ? row.artifact : null;
    }

    return {
        async get() {
            const now = clock();
            if (checkedAt && now - checkedAt < nextCheckMs) return cached;

            try {
                cached = (await readRegistry()) ?? loadModel(filePath);
                nextCheckMs = REFRESH_MS;
            } catch (error) {
                console.warn(
                    "Smart notifications: model registry unavailable, using the model file:",
                    error.message,
                );
                cached = loadModel(filePath);
                nextCheckMs = RETRY_MS;
            }
            checkedAt = now;
            return cached;
        },
    };
}
