import { Router } from "express";
import { SignUpSchema, LoginSchema } from "@ami/shared";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/User.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../services/jwt.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { env } from "../config/env.js";
import { writeAuditLog } from "../services/audit.js";

export const authRoutes = Router();

authRoutes.post(
  "/signup",
  asyncHandler(async (req, res) => {
    const { email, password, name } = SignUpSchema.parse(req.body);
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: "Email already registered" });

    const adminEmails = (env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean);
    const role = adminEmails.includes(email.toLowerCase()) ? "admin" : "user";

    const user = new User({ email, name, role, passwordHash: "temp", acceptedTermsAt: new Date() }) as any;
    await user.setPassword(password);

    const refreshToken = signRefreshToken(user._id.toString());
    user.setRefreshToken(refreshToken);
    await user.save();

    const accessToken = signAccessToken(user._id.toString());
    void writeAuditLog({ req, event: "auth.signup", status: 200, userId: user._id.toString(), meta: { role: user.role } });
    res.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt.toISOString()
      },
      tokens: { accessToken, refreshToken }
    });
  })
);

authRoutes.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = LoginSchema.parse(req.body);
    const user = (await User.findOne({ email })) as any;
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const ok = await user.verifyPassword(password);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const refreshToken = signRefreshToken(user._id.toString());
    user.setRefreshToken(refreshToken);
    await user.save();

    const accessToken = signAccessToken(user._id.toString());
    void writeAuditLog({ req, event: "auth.login", status: 200, userId: user._id.toString() });
    res.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt.toISOString()
      },
      tokens: { accessToken, refreshToken }
    });
  })
);

authRoutes.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const token = String(req.body?.refreshToken ?? "");
    if (!token) return res.status(400).json({ error: "Missing refreshToken" });

    const payload = verifyRefreshToken(token);
    const user = (await User.findById(payload.sub)) as any;
    if (!user || !user.hasRefreshToken(token)) return res.status(401).json({ error: "Invalid refreshToken" });

    const refreshToken = signRefreshToken(user._id.toString());
    user.setRefreshToken(refreshToken);
    await user.save();

    const accessToken = signAccessToken(user._id.toString());
    res.json({ tokens: { accessToken, refreshToken } });
  })
);

authRoutes.get(
  "/me",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const user = await User.findById(req.user!.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt.toISOString()
      }
    });
  })
);

authRoutes.post(
  "/logout",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    await User.updateOne({ _id: req.user!.id }, { $set: { refreshTokenHash: null } });
    void writeAuditLog({ req, event: "auth.logout", status: 200, userId: req.user!.id });
    res.json({ ok: true });
  })
);
