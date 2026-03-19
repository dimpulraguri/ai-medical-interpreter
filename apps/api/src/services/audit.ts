import type { Request } from "express";
import { AuditLog } from "../models/AuditLog.js";

export async function writeAuditLog(input: {
  req: Request;
  event: string;
  status: number;
  userId?: string | null;
  meta?: Record<string, unknown> | null;
}) {
  try {
    const { req, event, status, userId, meta } = input;
    await AuditLog.create({
      userId: userId ?? null,
      event,
      status,
      method: req.method,
      path: req.originalUrl,
      ip: req.ip,
      userAgent: req.get("user-agent") ?? null,
      meta: meta ?? null
    });
  } catch {
    // Never block requests due to audit logging failures.
  }
}

