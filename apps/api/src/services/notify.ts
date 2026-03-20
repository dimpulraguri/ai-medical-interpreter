import sgMail from "@sendgrid/mail";

import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { User } from "../models/User.js";

function initSendgrid() {
  if (env.SENDGRID_API_KEY) sgMail.setApiKey(env.SENDGRID_API_KEY);
}

export async function notifyUser(userId: string, payload: { title: string; body: string }) {
  const user = await User.findById(userId).select({ email: 1, name: 1 });
  if (!user) return;

  initSendgrid();

  if (env.SENDGRID_API_KEY && env.EMAIL_FROM) {
    await sgMail
      .send({
        to: user.email,
        from: env.EMAIL_FROM,
        subject: payload.title,
        text: payload.body
      })
      .catch((err) => logger.warn({ err }, "sendgrid failed"));
  }
}
