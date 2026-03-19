import { Router } from "express";
import { CreateReminderSchema } from "@ami/shared";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Reminder } from "../models/Reminder.js";
import { writeAuditLog } from "../services/audit.js";

export const reminderRoutes = Router();

reminderRoutes.get(
  "/",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const items = await Reminder.find({ userId: req.user!.id }).sort({ createdAt: -1 }).limit(200);
    res.json({
      reminders: items.map((r) => ({
        id: r._id.toString(),
        type: r.type,
        title: r.title,
        message: r.message,
        frequency: r.frequency,
        times: r.times,
        enabled: r.enabled,
        createdAt: r.createdAt.toISOString()
      }))
    });
  })
);

reminderRoutes.post(
  "/",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = CreateReminderSchema.parse(req.body);
    const r = await Reminder.create({ userId: req.user!.id, ...body });
    void writeAuditLog({ req, event: "reminders.create", status: 201, userId: req.user!.id, meta: { reminderId: r._id.toString(), type: r.type } });
    res.status(201).json({ id: r._id.toString() });
  })
);

reminderRoutes.patch(
  "/:id",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const enabled = Boolean(req.body?.enabled);
    const ok = await Reminder.updateOne({ _id: req.params.id, userId: req.user!.id }, { $set: { enabled } });
    if (!ok.matchedCount) return res.status(404).json({ error: "Reminder not found" });
    void writeAuditLog({ req, event: "reminders.toggle", status: 200, userId: req.user!.id, meta: { reminderId: req.params.id, enabled } });
    res.json({ ok: true });
  })
);

reminderRoutes.delete(
  "/:id",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const ok = await Reminder.deleteOne({ _id: req.params.id, userId: req.user!.id });
    if (!ok.deletedCount) return res.status(404).json({ error: "Reminder not found" });
    void writeAuditLog({ req, event: "reminders.delete", status: 200, userId: req.user!.id, meta: { reminderId: req.params.id } });
    res.json({ ok: true });
  })
);
