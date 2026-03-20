import { Router } from "express";
import { authRoutes } from "./auth.js";
import { reportRoutes } from "./reports.js";
import { chatRoutes } from "./chat.js";
import { reminderRoutes } from "./reminders.js";
import { medsRoutes } from "./meds.js";
import { dashboardRoutes } from "./dashboard.js";
import { metricsRoutes } from "./metrics.js";
import { profileRoutes } from "./profile.js";
import { adminRoutes } from "./admin.js";
import { notificationsRoutes } from "./notifications.js";

export const routes = Router();

routes.get("/", (_req, res) => {
  res.json({ ok: true, name: "ai-medical-api", version: "0.1.0" });
});

routes.use("/auth", authRoutes);
routes.use("/reports", reportRoutes);
routes.use("/chat", chatRoutes);
routes.use("/reminders", reminderRoutes);
routes.use("/meds", medsRoutes);
routes.use("/dashboard", dashboardRoutes);
routes.use("/metrics", metricsRoutes);
routes.use("/profile", profileRoutes);
routes.use("/notifications", notificationsRoutes);
routes.use("/admin", adminRoutes);
