import OpenAI from "openai";
import { env } from "../config/env.js";

export const openai = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;

export function requireOpenAI() {
  if (!openai) {
    const err = new Error("OpenAI is not configured. Set OPENAI_API_KEY in apps/api/.env.");
    (err as any).statusCode = 503;
    throw err;
  }
  return openai;
}
