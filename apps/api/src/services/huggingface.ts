import { env } from "../config/env.js";

function modelPath(repoId: string) {
  // Preserve "/" between namespace and model name while safely encoding each segment.
  return repoId
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
}

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

  const url = `https://api-inference.huggingface.co/models/${modelPath(env.HF_MODEL)}`;
  const body = JSON.stringify({
    inputs: input.prompt,
    parameters: {
      max_new_tokens: Math.max(64, Math.min(900, input.maxNewTokens ?? 500)),
      temperature: input.temperature ?? 0.2,
      return_full_text: false
    }
  });

  // HF may return 503 while the model "warms up". Retry a couple of times.
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
