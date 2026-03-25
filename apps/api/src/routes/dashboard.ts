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
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const todayStr = `${yyyy}-${mm}-${dd}`;

  const [items, schedules] = await Promise.all([
    Reminder.find({ userId, enabled: true }).select({ title: 1, type: 1, times: 1, frequency: 1, createdAt: 1 }),
    MedicineSchedule.find({ userId, enabled: true }).select({ name: 1, dosage: 1, times: 1, startDate: 1, durationDays: 1, enabled: 1 })
  ]);

  const reminderItems = items
    .flatMap((r) =>
      r.times.map((t) => ({ id: r._id.toString(), title: r.title, time: t, type: r.type, frequency: r.frequency, createdAt: r.createdAt }))
    )
    .filter((x) => {
      if (x.frequency === "weekly") return x.createdAt.getDay() === now.getDay();
      if (x.frequency === "monthly") return x.createdAt.getDate() === now.getDate();
      return true;
    });

  const medicineItems = schedules
    .filter((s) => {
      const start = new Date(`${s.startDate}T00:00:00`);
      const end = new Date(start);
      end.setDate(end.getDate() + s.durationDays);
      const today = new Date(`${todayStr}T00:00:00`);
      return today >= start && today < end;
    })
    .flatMap((s) =>
      s.times.map((t) => ({
        id: `${s._id.toString()}_${t}`,
        title: `${s.name} (${s.dosage})`,
        time: t,
        type: "medicine" as const
      }))
    );

  return [...reminderItems, ...medicineItems]
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
    MedicineLog.find({ userId, plannedAt: { $gte: from, $lte: now } }).select({ status: 1, plannedAt: 1, scheduleId: 1, loggedAt: 1 })
  ]);
  const taken = countUniqueTaken(logs as any);
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
  const pctRaw = planned > 0 ? Math.round((taken / planned) * 100) : null;
  return pctRaw == null ? null : Math.min(100, pctRaw);
}

function countUniqueTaken(
  logs: Array<{ scheduleId: any; plannedAt: Date; status: "taken" | "skipped"; loggedAt: Date }>
) {
  const map = new Map<string, { status: "taken" | "skipped"; loggedAt: Date }>();
  for (const l of logs) {
    const key = `${l.scheduleId.toString()}_${l.plannedAt.toISOString()}`;
    const existing = map.get(key);
    if (!existing || l.loggedAt > existing.loggedAt) {
      map.set(key, { status: l.status, loggedAt: l.loggedAt });
    }
  }
  let taken = 0;
  for (const v of map.values()) if (v.status === "taken") taken += 1;
  return taken;
}
