import { Router } from "express";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/User.js";
import { Report } from "../models/Report.js";
import { AuditLog } from "../models/AuditLog.js";

export const adminRoutes = Router();

adminRoutes.use(requireAuth, requireRole("admin"));

adminRoutes.get(
  "/users",
  asyncHandler(async (_req: AuthedRequest, res) => {
    const users = await User.find({})
      .sort({ createdAt: -1 })
      .limit(200)
      .select({ email: 1, name: 1, role: 1, createdAt: 1 });
    res.json({
      users: users.map((u) => ({
        id: u._id.toString(),
        email: u.email,
        name: u.name,
        role: u.role,
        createdAt: u.createdAt.toISOString()
      }))
    });
  })
);

adminRoutes.get(
  "/reports",
  asyncHandler(async (_req: AuthedRequest, res) => {
    const reports = await Report.find({})
      .sort({ createdAt: -1 })
      .limit(200)
      .select({ userId: 1, filename: 1, status: 1, createdAt: 1 });
    res.json({
      reports: reports.map((r) => ({
        id: r._id.toString(),
        userId: r.userId.toString(),
        filename: r.filename,
        status: r.status,
        createdAt: r.createdAt.toISOString()
      }))
    });
  })
);

adminRoutes.get(
  "/audit",
  asyncHandler(async (req: AuthedRequest, res) => {
    const limit = Math.max(1, Math.min(500, Number(req.query.limit ?? 200)));
    const items = await AuditLog.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .select({ userId: 1, event: 1, method: 1, path: 1, status: 1, ip: 1, userAgent: 1, meta: 1, createdAt: 1 });

    res.json({
      audit: items.map((a) => ({
        id: a._id.toString(),
        userId: a.userId ? a.userId.toString() : null,
        event: a.event,
        method: a.method,
        path: a.path,
        status: a.status,
        ip: a.ip,
        userAgent: a.userAgent,
        meta: a.meta ?? null,
        createdAt: a.createdAt.toISOString()
      }))
    });
  })
);
