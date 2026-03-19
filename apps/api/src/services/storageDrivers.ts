import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { env } from "../config/env.js";

export type StorageDriver = {
  putObject: (key: string, data: Buffer, contentType: string) => Promise<void>;
  getObject: (key: string) => Promise<Buffer>;
};

export function getStorageDriver(): StorageDriver {
  if (env.STORAGE_DRIVER === "s3") return createS3Driver();
  return createLocalDriver();
}

function createLocalDriver(): StorageDriver {
  const ROOT = env.LOCAL_UPLOAD_DIR
    ? path.resolve(env.LOCAL_UPLOAD_DIR)
    : path.join(os.tmpdir(), "ai-medical-interpreter", "uploads");
  return {
    async putObject(key, data) {
      await fs.mkdir(ROOT, { recursive: true });
      await fs.writeFile(path.join(ROOT, key), data);
    },
    async getObject(key) {
      const full = path.join(ROOT, key);
      return fs.readFile(full);
    }
  };
}

function createS3Driver(): StorageDriver {
  if (!env.S3_BUCKET || !env.S3_REGION || !env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY) {
    throw new Error("S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY are required for STORAGE_DRIVER=s3");
  }

  const client = new S3Client({
    region: env.S3_REGION,
    endpoint: env.S3_ENDPOINT || undefined,
    credentials: { accessKeyId: env.S3_ACCESS_KEY_ID, secretAccessKey: env.S3_SECRET_ACCESS_KEY },
    forcePathStyle: Boolean(env.S3_ENDPOINT)
  });

  return {
    async putObject(key, data, contentType) {
      await client.send(
        new PutObjectCommand({
          Bucket: env.S3_BUCKET!,
          Key: key,
          Body: data,
          ContentType: contentType
        })
      );
    },
    async getObject(key) {
      const res = await client.send(
        new GetObjectCommand({
          Bucket: env.S3_BUCKET!,
          Key: key
        })
      );
      if (!res.Body) throw new Error("S3 object body missing");
      return streamToBuffer(res.Body as any);
    }
  };
}

async function streamToBuffer(stream: AsyncIterable<Uint8Array> | NodeJS.ReadableStream) {
  const chunks: Buffer[] = [];
  for await (const chunk of stream as any) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}
