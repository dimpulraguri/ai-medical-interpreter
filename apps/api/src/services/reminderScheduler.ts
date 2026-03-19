import cron from "node-cron";
import { logger } from "../config/logger.js";
import { Reminder } from "../models/Reminder.js";
import { MedicineSchedule } from "../models/MedicineSchedule.js";
import { notifyUser } from "./notify.js";

let started = false;

function nowHHMM(d: Date) {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function shouldFireWeekly(createdAt: Date, now: Date) {
  return createdAt.getDay() === now.getDay();
}

function shouldFireMonthly(createdAt: Date, now: Date) {
  return createdAt.getDate() === now.getDate();
}

export function startReminderScheduler() {
  if (started) return;
  started = true;

  cron.schedule("* * * * *", async () => {
    const now = new Date();
    const time = nowHHMM(now);

    try {
      const reminders = await Reminder.find({ enabled: true, times: time }).select({
        userId: 1,
        title: 1,
        message: 1,
        frequency: 1,
        createdAt: 1
      });

      await Promise.all(
        reminders.map(async (r) => {
          if (r.frequency === "weekly" && !shouldFireWeekly(r.createdAt, now)) return;
          if (r.frequency === "monthly" && !shouldFireMonthly(r.createdAt, now)) return;
          await notifyUser(r.userId.toString(), { title: r.title, body: r.message || r.title });
        })
      );

      const meds = await MedicineSchedule.find({ enabled: true, times: time }).select({
        userId: 1,
        name: 1,
        dosage: 1,
        startDate: 1,
        durationDays: 1
      });

      await Promise.all(
        meds.map(async (m) => {
          const start = new Date(`${m.startDate}T00:00:00`);
          const end = new Date(start);
          end.setDate(end.getDate() + m.durationDays);
          if (now < start || now >= end) return;
          await notifyUser(m.userId.toString(), {
            title: `Medicine reminder: ${m.name}`,
            body: `${m.dosage} — scheduled now`
          });
        })
      );
    } catch (err) {
      logger.warn({ err }, "scheduler tick failed");
    }
  });

  logger.info("reminder scheduler started");
}

