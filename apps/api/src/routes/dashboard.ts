import { Router } from "express";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Report } from "../models/Report.js";
import { Reminder } from "../models/Reminder.js";
import { MedicineSchedule } from "../models/MedicineSchedule.js";
import { MedicineLog } from "../models/MedicineLog.js";
import { decryptJson } from "../services/encryption.js";

export const dashboardRoutes = Router();

dashboardRoutes.get(
  "/summary",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const [reportsCount, readyReports] = await Promise.all([
      Report.countDocuments({ userId: req.user!.id }),
      Report.find({ userId: req.user!.id, status: "ready" }).select({ abnormalFindingsEnc: 1 }).limit(50)
    ]);

    const abnormalCount = readyReports.reduce((acc, r) => {
      const arr = decryptJson<unknown[]>(r.abnormalFindingsEnc) ?? [];
      return acc + (Array.isArray(arr) && arr.length ? 1 : 0);
    }, 0);

    const todayReminders = await remindersForToday(req.user!.id);
    const adherencePct = await adherence14d(req.user!.id);

    res.json({ summary: { reportsCount, abnormalCount, adherencePct, todayReminders } });
  })
);

async function remindersForToday(userId: string) {
  const now = new Date();
  const items = await Reminder.find({ userId, enabled: true }).select({ title: 1, type: 1, times: 1, frequency: 1, createdAt: 1 });
  return items
    .flatMap((r) =>
      r.times.map((t) => ({ id: r._id.toString(), title: r.title, time: t, type: r.type, frequency: r.frequency, createdAt: r.createdAt }))
    )
    .filter((x) => {
      if (x.frequency === "weekly") return x.createdAt.getDay() === now.getDay();
      if (x.frequency === "monthly") return x.createdAt.getDate() === now.getDate();
      return true;
    })
    .sort((a, b) => a.time.localeCompare(b.time))
    .slice(0, 20)
    .map(({ id, title, time, type }) => ({ id, title, time, type }));
}

async function adherence14d(userId: string) {
  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - 14);
  const [schedules, logs] = await Promise.all([
    MedicineSchedule.find({ userId, enabled: true }).select({ startDate: 1, durationDays: 1, times: 1, enabled: 1 }),
    MedicineLog.find({ userId, plannedAt: { $gte: from, $lte: now } }).select({ status: 1 })
  ]);
  const taken = logs.filter((l) => l.status === "taken").length;
  const planned = schedules.reduce((acc, s) => {
    const start = new Date(`${s.startDate}T00:00:00`);
    const end = new Date(start);
    end.setDate(end.getDate() + s.durationDays);
    const rangeStart = start > from ? start : from;
    const rangeEnd = end < now ? end : now;
    if (rangeEnd <= rangeStart) return acc;
    const days = Math.ceil((rangeEnd.getTime() - rangeStart.getTime()) / (24 * 60 * 60 * 1000));
    return acc + days * s.times.length;
  }, 0);
  return planned > 0 ? Math.round((taken / planned) * 100) : null;
}

