import { Router } from "express";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { notifyUser } from "../services/notify.js";
import { writeAuditLog } from "../services/audit.js";

export const notificationsRoutes = Router();

// Simple verification endpoint for push/email setup.
notificationsRoutes.post(
  "/test",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const title = "Test notification";
    const body = "Notifications are working on this device.";
    await notifyUser(req.user!.id, { title, body });
    void writeAuditLog({ req, event: "notifications.test", status: 200, userId: req.user!.id });
    res.json({ ok: true });
  })
);

