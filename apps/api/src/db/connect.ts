import mongoose from "mongoose";
import { logger } from "../config/logger.js";
import type { MongoMemoryServer } from "mongodb-memory-server";
import path from "node:path";
import fs from "node:fs/promises";

export async function connectMongo(uri: string) {
  mongoose.set("strictQuery", true);
  const finalUri = uri === "memory" ? await startInMemoryMongo() : uri;
  await mongoose.connect(finalUri, { autoIndex: process.env.NODE_ENV !== "production" });
  logger.info("mongo connected");
}

let memory: MongoMemoryServer | null = null;

async function startInMemoryMongo() {
  const { MongoMemoryServer } = await import("mongodb-memory-server");

  const downloadDir =
    process.env.MONGOMS_DOWNLOAD_DIR && process.env.MONGOMS_DOWNLOAD_DIR.trim()
      ? process.env.MONGOMS_DOWNLOAD_DIR.trim()
      : path.resolve(process.cwd(), ".mongoms");

  await fs.mkdir(downloadDir, { recursive: true });

  memory ??= await MongoMemoryServer.create({ binary: { downloadDir } });
  const uri = memory.getUri();
  logger.warn({ uri }, "using in-memory MongoDB (dev only)");

  const stop = async () => {
    try {
      await mongoose.disconnect();
    } finally {
      await memory?.stop();
      memory = null;
    }
  };

  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);

  return uri;
}
