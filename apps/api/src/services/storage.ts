import crypto from "node:crypto";

import { encryptBuffer, decryptBuffer } from "./storageCrypto.js";
import { getStorageDriver } from "./storageDrivers.js";

const driver = getStorageDriver();

export async function saveEncryptedUpload(buffer: Buffer, originalName: string) {
  const id = crypto.randomUUID();
  const safe = originalName.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 64) || "upload";
  const key = `${id}_${safe}.bin.enc`;
  const encrypted = encryptBuffer(buffer);
  await driver.putObject(key, encrypted, "application/octet-stream");
  return { storageKey: key };
}

export async function readEncryptedUpload(storageKey: string) {
  const encrypted = await driver.getObject(storageKey);
  return decryptBuffer(encrypted);
}
