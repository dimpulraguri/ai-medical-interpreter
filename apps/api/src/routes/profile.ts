import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/User.js";
import { decryptJson, encryptJson } from "../services/encryption.js";
import { writeAuditLog } from "../services/audit.js";

export const profileRoutes = Router();

profileRoutes.get(
  "/",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const user = await User.findById(req.user!.id).select({ medicalHistoryEnc: 1, name: 1, email: 1, createdAt: 1 });
    if (!user) return res.status(404).json({ error: "User not found" });
    const medicalHistory = decryptJson<string[]>(user.medicalHistoryEnc) ?? [];
    res.json({ medicalHistory });
  })
);

profileRoutes.put(
  "/medical-history",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = z.object({ items: z.array(z.string().min(1).max(200)).max(200) }).parse(req.body);
    await User.updateOne({ _id: req.user!.id }, { $set: { medicalHistoryEnc: encryptJson(body.items) } });
    void writeAuditLog({ req, event: "profile.medical_history_update", status: 200, userId: req.user!.id, meta: { itemsCount: body.items.length } });
    res.json({ ok: true });
  })
);
