import crypto from "node:crypto";
import { env } from "../config/env.js";

const KEY = Buffer.from(env.DATA_ENCRYPTION_KEY_BASE64, "base64");
if (KEY.length !== 32) throw new Error("DATA_ENCRYPTION_KEY_BASE64 must decode to 32 bytes");

export function encryptBuffer(buf: Buffer) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
  const ciphertext = Buffer.concat([cipher.update(buf), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([Buffer.from("AMI1"), iv, tag, ciphertext]);
}

export function decryptBuffer(payload: Buffer) {
  if (payload.subarray(0, 4).toString("utf8") !== "AMI1") throw new Error("Invalid file header");
  const iv = payload.subarray(4, 16);
  const tag = payload.subarray(16, 32);
  const ciphertext = payload.subarray(32);
  const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

