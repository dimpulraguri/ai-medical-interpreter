import type { Response, NextFunction } from "express";
import type { AuthedRequest } from "./auth.js";
import { User } from "../models/User.js";

export function requireRole(role: "admin") {
  return async (req: AuthedRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const user = await User.findById(userId).select({ role: 1 });
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    if (user.role !== role) return res.status(403).json({ error: "Forbidden" });
    next();
  };
}

