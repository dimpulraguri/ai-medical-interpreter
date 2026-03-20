import sgMail from "@sendgrid/mail";
import admin from "firebase-admin";

import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { User } from "../models/User.js";

let firebaseReady = false;

function initFirebase() {
  if (firebaseReady) return;
  if (!env.FIREBASE_SERVICE_ACCOUNT_JSON) return;
  try {
    const svc = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON);
    admin.initializeApp({ credential: admin.credential.cert(svc) });
    firebaseReady = true;
    logger.info("firebase-admin initialized");
  } catch (err) {
    logger.warn({ err }, "firebase init failed");
  }
}

function initSendgrid() {
  if (env.SENDGRID_API_KEY) sgMail.setApiKey(env.SENDGRID_API_KEY);
}

export async function notifyUser(userId: string, payload: { title: string; body: string }) {
  const user = await User.findById(userId).select({ email: 1, deviceTokens: 1, name: 1 });
  if (!user) return;

  initSendgrid();
  initFirebase();

  const tasks: Array<Promise<unknown>> = [];

  if (env.SENDGRID_API_KEY && env.EMAIL_FROM) {
    tasks.push(
      sgMail
        .send({
          to: user.email,
          from: env.EMAIL_FROM,
          subject: payload.title,
          text: payload.body
        })
        .catch((err) => logger.warn({ err }, "sendgrid failed"))
    );
  }

  if (firebaseReady && user.deviceTokens?.length) {
    tasks.push(
      admin
        .messaging()
        .sendEachForMulticast({
          tokens: user.deviceTokens,
          notification: { title: payload.title, body: payload.body }
        })
        .then(async (r) => {
          const badTokens: string[] = [];
          r.responses.forEach((resp, idx) => {
            if (resp.success) return;
            const code = (resp.error as any)?.code as string | undefined;
            // Remove permanently invalid tokens.
            if (
              code === "messaging/registration-token-not-registered" ||
              code === "messaging/invalid-registration-token"
            ) {
              const token = user.deviceTokens?.[idx];
              if (token) badTokens.push(token);
            }
          });
          if (badTokens.length) {
            await User.updateOne({ _id: userId }, { $pull: { deviceTokens: { $in: badTokens } } });
            logger.info({ removed: badTokens.length }, "removed invalid fcm tokens");
          }
        })
        .catch((err) => logger.warn({ err }, "fcm failed"))
    );
  }

  await Promise.all(tasks);
}
