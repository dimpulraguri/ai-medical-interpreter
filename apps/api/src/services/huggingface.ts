import { env } from "../config/env.js";

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

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

  // Hugging Face deprecated `api-inference.huggingface.co`; use the router OpenAI-compatible API.
  // Docs: https://huggingface.co/inference-api/
  const url = "https://router.huggingface.co/v1/chat/completions";
  const body = JSON.stringify({
    model: env.HF_MODEL,
    messages: [{ role: "user", content: input.prompt }],
    temperature: input.temperature ?? 0.2,
    max_tokens: Math.max(64, Math.min(900, input.maxNewTokens ?? 500))
  });

  // Router may return 503 while capacity is warming up. Retry a couple of times.
  let lastStatus: number | null = null;
  let lastText = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.HF_API_KEY}`,
        "content-type": "application/json"
      },
      body
    });

    const text = await res.text();
    lastStatus = res.status;
    lastText = text;

    if (res.ok) {
      try {
        const json = JSON.parse(text) as any;
        const generated = json?.choices?.[0]?.message?.content;
        if (typeof generated === "string") return generated.trim();
      } catch {
        // fall through
      }
      return String(text ?? "").trim();
    }

    if (res.status === 503 && attempt < 2) {
      await sleep(1500 * (attempt + 1));
      continue;
    }
    break;
  }

  const err = new Error(`HF inference error (HTTP ${lastStatus ?? "unknown"}).`);
  (err as any).statusCode = 503;
  (err as any).details = String(lastText ?? "").slice(0, 500);
  throw err;
}
