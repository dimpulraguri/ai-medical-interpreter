import { env } from "../config/env.js";

export async function hfGenerateText(input: {
  prompt: string;
  maxNewTokens?: number;
  temperature?: number;
}): Promise<string> {
  if (!env.HF_API_KEY) {
    const err = new Error("HuggingFace is not configured. Set HF_API_KEY in apps/api/.env.");
    (err as any).statusCode = 503;
    throw err;
  }

  const url = `https://api-inference.huggingface.co/models/${encodeURIComponent(env.HF_MODEL)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.HF_API_KEY}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      inputs: input.prompt,
      parameters: {
        max_new_tokens: Math.max(64, Math.min(900, input.maxNewTokens ?? 500)),
        temperature: input.temperature ?? 0.2,
        return_full_text: false
      }
    })
  });

  const text = await res.text();
  if (!res.ok) {
    const err = new Error(`HF inference error (HTTP ${res.status}).`);
    (err as any).statusCode = 503;
    (err as any).details = text.slice(0, 500);
    throw err;
  }

  // HF Inference returns an array like [{ generated_text: "..." }]
  try {
    const json = JSON.parse(text) as any;
    const generated = json?.[0]?.generated_text;
    if (typeof generated === "string") return generated.trim();
  } catch {
    // fall through
  }

  return String(text ?? "").trim();
}

