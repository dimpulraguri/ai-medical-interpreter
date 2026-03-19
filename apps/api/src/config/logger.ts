import pino from "pino";

export const logger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  redact: {
    paths: ["req.headers.authorization", "OPENAI_API_KEY", "SENDGRID_API_KEY"],
    remove: true
  }
});

