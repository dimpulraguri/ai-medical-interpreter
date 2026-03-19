import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import mongoose from "mongoose";

import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { routes } from "./routes/index.js";
import { notFound, errorHandler } from "./middleware/errors.js";

export function createApp() {
  const app = express();

  app.use(
    cors(
      env.NODE_ENV === "production"
        ? {
            origin: env.CORS_ORIGIN.split(",").map((x) => x.trim()),
            credentials: true
          }
        : {
            origin: true,
            credentials: true
          }
    )
  );
  app.use(helmet());
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 300
    })
  );
  app.use(pinoHttp({ logger }));

  // Render/other platforms may ping `/` to detect a healthy service.
  app.get("/", (_req, res) => res.json({ ok: true, service: "ai-medical-api" }));
  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.get("/health/ready", (_req, res) => {
    const mongoReady = mongoose.connection.readyState === 1;
    const aiReady =
      env.AI_MODE === "demo" ||
      env.AI_MODE === "off" ||
      (env.AI_MODE === "openai" && Boolean(env.OPENAI_API_KEY)) ||
      (env.AI_MODE === "huggingface" && Boolean(env.HF_API_KEY));
    const ready = mongoReady && aiReady;

    res.status(ready ? 200 : 503).json({
      ok: ready,
      mongo: { ready: mongoReady, state: mongoose.connection.readyState },
      ai: { mode: env.AI_MODE, ready: aiReady }
    });
  });
  app.use("/api", routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
