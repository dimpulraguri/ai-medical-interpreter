import crypto from "crypto";
import { env } from "../config/env.js";

export type EncryptedBlob = {
  iv: string; // base64
  tag: string; // base64
  data: string; // base64
};

const KEY = Buffer.from(env.DATA_ENCRYPTION_KEY_BASE64, "base64");
if (KEY.length !== 32) throw new Error("DATA_ENCRYPTION_KEY_BASE64 must decode to 32 bytes");

export function encryptJson(value: unknown): EncryptedBlob {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
  const plaintext = Buffer.from(JSON.stringify(value), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    data: ciphertext.toString("base64")
  };
}

export function decryptJson<T>(blob: EncryptedBlob | null | undefined): T | null {
  if (!blob) return null;
  const iv = Buffer.from(blob.iv, "base64");
  const tag = Buffer.from(blob.tag, "base64");
  const data = Buffer.from(blob.data, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  return JSON.parse(plaintext) as T;
}

