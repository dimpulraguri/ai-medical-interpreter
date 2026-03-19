import "dotenv/config";
import mongoose from "mongoose";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "..", "apps", "api", ".env");

// Load apps/api/.env explicitly (same as API does)
await (await import("dotenv")).config({ path: envPath });

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is missing in apps/api/.env");
  process.exit(1);
}
if (uri === "memory") {
  console.error("MONGODB_URI is set to 'memory'. Set it to your Atlas mongodb+srv URI to test Atlas.");
  process.exit(1);
}

try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  console.log("MongoDB connection OK");
  await mongoose.disconnect();
  process.exit(0);
} catch (err) {
  console.error("MongoDB connection FAILED");
  console.error(err?.message ?? err);
  process.exit(2);
}

