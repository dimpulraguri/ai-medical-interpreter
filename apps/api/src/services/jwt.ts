import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../config/env.js";

export function signAccessToken(userId: string) {
  return jwt.sign({}, env.JWT_ACCESS_SECRET, { subject: userId, expiresIn: `${env.JWT_ACCESS_TTL_MIN}m` });
}

export function signRefreshToken(userId: string) {
  const jti = crypto.randomUUID();
  return jwt.sign({ jti }, env.JWT_REFRESH_SECRET, {
    subject: userId,
    expiresIn: `${env.JWT_REFRESH_TTL_DAYS}d`
  });
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as { sub: string; jti: string };
}

