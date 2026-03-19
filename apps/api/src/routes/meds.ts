import { Router } from "express";
import { z } from "zod";
import { CreateMedicineScheduleSchema } from "@ami/shared";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { MedicineSchedule } from "../models/MedicineSchedule.js";
import { MedicineLog } from "../models/MedicineLog.js";
import { writeAuditLog } from "../services/audit.js";

export const medsRoutes = Router();

medsRoutes.get(
  "/schedules",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const items = await MedicineSchedule.find({ userId: req.user!.id }).sort({ createdAt: -1 }).limit(200);
    res.json({
      schedules: items.map((m) => ({
        id: m._id.toString(),
        name: m.name,
        dosage: m.dosage,
        times: m.times,
        startDate: m.startDate,
        durationDays: m.durationDays,
        enabled: m.enabled,
        createdAt: m.createdAt.toISOString()
      }))
    });
  })
);

medsRoutes.post(
  "/schedules",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = CreateMedicineScheduleSchema.parse(req.body);
    const m = await MedicineSchedule.create({ userId: req.user!.id, ...body });
    void writeAuditLog({ req, event: "meds.schedule_create", status: 201, userId: req.user!.id, meta: { scheduleId: m._id.toString() } });
    res.status(201).json({ id: m._id.toString() });
  })
);

medsRoutes.patch(
  "/schedules/:id",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const enabled = Boolean(req.body?.enabled);
    const ok = await MedicineSchedule.updateOne({ _id: req.params.id, userId: req.user!.id }, { $set: { enabled } });
    if (!ok.matchedCount) return res.status(404).json({ error: "Schedule not found" });
    void writeAuditLog({ req, event: "meds.schedule_toggle", status: 200, userId: req.user!.id, meta: { scheduleId: req.params.id, enabled } });
    res.json({ ok: true });
  })
);

medsRoutes.delete(
  "/schedules/:id",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const ok = await MedicineSchedule.deleteOne({ _id: req.params.id, userId: req.user!.id });
    if (!ok.deletedCount) return res.status(404).json({ error: "Schedule not found" });
    void writeAuditLog({ req, event: "meds.schedule_delete", status: 200, userId: req.user!.id, meta: { scheduleId: req.params.id } });
    res.json({ ok: true });
  })
);

const LogSchema = z.object({
  scheduleId: z.string().min(1),
  plannedAt: z.string().datetime(),
  status: z.enum(["taken", "skipped"])
});

medsRoutes.post(
  "/logs",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = LogSchema.parse(req.body);
    const log = await MedicineLog.create({
      userId: req.user!.id,
      scheduleId: body.scheduleId,
      plannedAt: new Date(body.plannedAt),
      status: body.status,
      loggedAt: new Date()
    });
    void writeAuditLog({ req, event: "meds.log", status: 201, userId: req.user!.id, meta: { scheduleId: body.scheduleId, status: body.status } });
    res.status(201).json({ id: log._id.toString() });
  })
);

medsRoutes.get(
  "/adherence",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const days = Math.max(7, Math.min(30, Number(req.query.days ?? 14)));
    const now = new Date();
    const from = new Date(now);
    from.setDate(from.getDate() - days);

    const schedules = await MedicineSchedule.find({ userId: req.user!.id, enabled: true });
    const logs = await MedicineLog.find({ userId: req.user!.id, plannedAt: { $gte: from, $lte: now } }).select({
      status: 1,
      plannedAt: 1
    });

    const taken = logs.filter((l) => l.status === "taken").length;
    const planned = plannedDosesWithinRange(schedules, from, now);
    const pct = planned > 0 ? Math.round((taken / planned) * 100) : null;

    res.json({ adherencePct: pct, planned, taken, days });
  })
);

function plannedDosesWithinRange(
  schedules: Array<{
    startDate: string;
    durationDays: number;
    times: string[];
    enabled: boolean;
  }>,
  from: Date,
  to: Date
) {
  let planned = 0;
  for (const s of schedules) {
    if (!s.enabled) continue;
    const start = new Date(`${s.startDate}T00:00:00`);
    const end = new Date(start);
    end.setDate(end.getDate() + s.durationDays);
    const rangeStart = start > from ? start : from;
    const rangeEnd = end < to ? end : to;
    if (rangeEnd <= rangeStart) continue;
    const days = Math.ceil((rangeEnd.getTime() - rangeStart.getTime()) / (24 * 60 * 60 * 1000));
    planned += days * s.times.length;
  }
  return planned;
}
