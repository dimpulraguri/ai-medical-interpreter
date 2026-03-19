import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectMongo } from "./db/connect.js";
import { logger } from "./config/logger.js";
import { startReminderScheduler } from "./services/reminderScheduler.js";

export async function start() {
  await connectMongo(env.MONGODB_URI);

  if (env.AI_MODE === "openai" && !env.OPENAI_API_KEY) {
    logger.warn("AI_MODE=openai but OPENAI_API_KEY is empty; AI endpoints will return 503 or demo fallbacks on quota errors");
  } else if (env.AI_MODE === "demo") {
    logger.info("AI_MODE=demo (no external AI calls)");
  } else if (env.AI_MODE === "off") {
    logger.info("AI_MODE=off (AI endpoints disabled)");
  }

  const app = createApp();

  const server = app.listen(env.PORT);

  server.once("listening", () => {
    logger.info({ port: env.PORT }, "api listening");
    startReminderScheduler();
  });

  server.once("error", (err) => {
    logger.error({ err }, "server error");
    process.exit(1);
  });
}
