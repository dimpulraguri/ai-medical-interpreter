import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();

const targets = [
  "apps/web/.next",
  "apps/api/dist",
  "packages/shared/dist",
  ".next",
  "node_modules/.cache"
];

async function rm(rel) {
  const p = path.join(root, rel);
  try {
    await fs.rm(p, { recursive: true, force: true });
    process.stdout.write(`[clean] ${rel}\n`);
  } catch (err) {
    process.stdout.write(`[skip] ${rel} (${err?.message ?? err})\n`);
  }
}

await Promise.all(targets.map(rm));
