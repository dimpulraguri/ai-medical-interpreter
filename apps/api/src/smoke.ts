import assert from "node:assert/strict";
import crypto from "node:crypto";

function setRequiredEnv() {
  process.env.NODE_ENV ||= "test";
  process.env.PORT ||= "0";
  process.env.CORS_ORIGIN ||= "http://localhost:3000";
  process.env.MONGODB_URI ||= "memory";
  process.env.JWT_ACCESS_SECRET ||= crypto.randomBytes(48).toString("hex");
  process.env.JWT_REFRESH_SECRET ||= crypto.randomBytes(48).toString("hex");
  process.env.DATA_ENCRYPTION_KEY_BASE64 ||= crypto.randomBytes(32).toString("base64");
  process.env.OPENAI_API_KEY ||= "";
}

async function main() {
  setRequiredEnv();

  const { connectMongo } = await import("./db/connect.js");
  await connectMongo(process.env.MONGODB_URI!);

  const { createApp } = await import("./app.js");
  const app = createApp();

  const server = await new Promise<import("node:http").Server>((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });

  const addr = server.address();
  assert.ok(addr && typeof addr === "object");
  const base = `http://127.0.0.1:${addr.port}`;

  try {
    const health = await fetch(`${base}/health`);
    assert.equal(health.status, 200);

    const email = `smoke_${Date.now()}@example.com`;
    const signupRes = await fetch(`${base}/api/auth/signup`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Smoke User", email, password: "password1234", acceptTerms: true })
    });
    assert.equal(signupRes.status, 200);
    const signupJson: any = await signupRes.json();
    assert.ok(signupJson?.tokens?.accessToken);

    const reminderRes = await fetch(`${base}/api/reminders`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${signupJson.tokens.accessToken}`
      },
      body: JSON.stringify({
        type: "water",
        title: "Drink water",
        message: "Hydrate",
        frequency: "daily",
        times: ["09:00"],
        enabled: true
      })
    });
    assert.equal(reminderRes.status, 201);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
}

main()
  .then(() => {
    process.stdout.write("SMOKE OK\n");
  })
  .catch((err) => {
    process.stderr.write(`SMOKE FAILED: ${err?.message ?? err}\n`);
    process.exitCode = 1;
  });
