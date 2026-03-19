import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { WaterLog } from "../models/WaterLog.js";
import { WeightLog } from "../models/WeightLog.js";
import { writeAuditLog } from "../services/audit.js";

export const metricsRoutes = Router();

metricsRoutes.get(
  "/water",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const items = await WaterLog.find({ userId: req.user!.id }).sort({ date: 1 }).limit(365);
    res.json({ water: items.map((x) => ({ id: x._id.toString(), date: x.date, glasses: x.glasses })) });
  })
);

metricsRoutes.post(
  "/water",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), glasses: z.number().int().min(0).max(40) }).parse(req.body);
    const doc = await WaterLog.findOneAndUpdate(
      { userId: req.user!.id, date: body.date },
      { $set: { glasses: body.glasses } },
      { upsert: true, new: true }
    );
    void writeAuditLog({ req, event: "metrics.water_set", status: 200, userId: req.user!.id, meta: { date: body.date, glasses: body.glasses } });
    res.json({ id: doc._id.toString() });
  })
);

metricsRoutes.get(
  "/weight",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const items = await WeightLog.find({ userId: req.user!.id }).sort({ date: 1 }).limit(365);
    res.json({ weight: items.map((x) => ({ id: x._id.toString(), date: x.date, weightKg: x.weightKg })) });
  })
);

metricsRoutes.post(
  "/weight",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), weightKg: z.number().min(1).max(500) }).parse(req.body);
    const doc = await WeightLog.findOneAndUpdate(
      { userId: req.user!.id, date: body.date },
      { $set: { weightKg: body.weightKg } },
      { upsert: true, new: true }
    );
    void writeAuditLog({ req, event: "metrics.weight_set", status: 200, userId: req.user!.id, meta: { date: body.date, weightKg: body.weightKg } });
    res.json({ id: doc._id.toString() });
  })
);
