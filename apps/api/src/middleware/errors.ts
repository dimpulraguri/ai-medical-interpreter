import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { logger } from "../config/logger.js";
import multer from "multer";
import OpenAI from "openai";

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: "Not found" });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: "Validation error", details: err.flatten() });
  }
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message, details: { code: err.code } });
  }
  if (err instanceof OpenAI.APIError) {
    const status = typeof err.status === "number" ? err.status : 502;
    return res.status(status).json({
      error: "AI service error",
      message: err.message,
      details: { status: err.status, code: (err as any).code, type: (err as any).type }
    });
  }
  const statusCode = typeof (err as any)?.statusCode === "number" ? (err as any).statusCode : null;
  if (statusCode) {
    return res.status(statusCode).json({ error: (err as any)?.message ?? "Error" });
  }
  logger.error({ err }, "unhandled error");
  res.status(500).json({ error: "Internal server error" });
}
