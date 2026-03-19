import { z } from "zod";
import { env } from "../config/env.js";
import { requireOpenAI } from "./openaiClient.js";
import OpenAI from "openai";
import { hfGenerateText } from "./huggingface.js";

const InterpretationSchema = z.object({
  abnormalFindings: z
    .array(
      z.object({
        parameter: z.string(),
        value: z.string(),
        flag: z.enum(["low", "high", "critical"]),
        note: z.string().optional()
      })
    )
    .default([]),
  explanationMarkdown: z.string(),
  whatToDo: z.array(z.string()).default([]),
  whatToAvoid: z.array(z.string()).default([]),
  foodToEat: z.array(z.string()).default([]),
  foodToAvoid: z.array(z.string()).default([]),
  lifestyle: z.array(z.string()).default([]),
  exercise: z.array(z.string()).default([]),
  reasons: z.array(z.string()).default([]),
  consultDoctorWhen: z.array(z.string()).default([]),
  disclaimer: z.string()
});

export type Interpretation = z.infer<typeof InterpretationSchema>;

export async function interpretMedicalReport(extractedText: string): Promise<Interpretation> {
  if (env.AI_MODE === "off") {
    const err = new Error("AI is disabled by the server.");
    (err as any).statusCode = 503;
    throw err;
  }
  if (env.AI_MODE === "demo") {
    return demoInterpretation(extractedText);
  }
  if (env.AI_MODE === "huggingface") {
    const instructions =
      "You are an empathetic, safety-first medical assistant (not a doctor). " +
      "Interpret lab reports and explain them in simple English. " +
      "Do not provide diagnoses. Provide possibilities and suggest consulting a clinician. " +
      "Highlight abnormal values only when clearly present; if uncertain, say unclear. " +
      "Provide low-risk lifestyle guidance, red flags, and when to consult a real doctor. " +
      "Return STRICT JSON only with keys: abnormalFindings, explanationMarkdown, whatToDo, whatToAvoid, foodToEat, foodToAvoid, lifestyle, exercise, reasons, consultDoctorWhen, disclaimer.";

    const prompt = [
      instructions,
      "",
      "Return JSON only.",
      "",
      "Report text:",
      extractedText.slice(0, 12000)
    ].join("\n");

    try {
      const out = await hfGenerateText({ prompt, maxNewTokens: 700, temperature: 0.2 });
      const json = safeJsonParse(out);
      return InterpretationSchema.parse(json);
    } catch (err) {
      // If the model can chat but struggles to output strict JSON, fall back to markdown-only interpretation
      // (still AI-generated, just less structured).
      try {
        const md = await hfGenerateText({
          prompt: [
            "You are an empathetic, safety-first medical assistant (not a doctor).",
            "Write a patient-friendly explanation of the following medical report in SIMPLE English.",
            "Do not diagnose. Provide possibilities, red flags, and when to consult a clinician.",
            "Output MARKDOWN only (no JSON). Use headings and bullet points.",
            "",
            "Report text:",
            extractedText.slice(0, 12000)
          ].join("\n"),
          maxNewTokens: 700,
          temperature: 0.2
        });

        const findings = inferAbnormalFindings(extractedText).slice(0, 12);
        return InterpretationSchema.parse({
          abnormalFindings: findings,
          explanationMarkdown: md.trim() || "AI explanation was empty. Please try again with a clearer report.",
          whatToDo: [],
          whatToAvoid: [],
          foodToEat: [],
          foodToAvoid: [],
          lifestyle: [],
          exercise: [],
          reasons: [],
          consultDoctorWhen: [],
          disclaimer: "Educational only; not medical advice or diagnosis."
        });
      } catch {
        return demoInterpretation(extractedText, {
          note: "HuggingFace AI failed to interpret this report. Showing a demo interpretation."
        });
      }
    }
  }

  const openai = requireOpenAI();
  const instructions =
    "You are an empathetic, safety-first medical assistant (not a doctor). " +
    "Interpret lab reports and explain them in simple English. " +
    "Do not provide diagnoses. Provide possibilities and suggest consulting a clinician. " +
    "Highlight abnormal values only when clearly present; if uncertain, say unclear. " +
    "Provide low-risk lifestyle guidance, red flags, and when to consult a real doctor. " +
    "Return STRICT JSON only with keys: abnormalFindings, explanationMarkdown, whatToDo, whatToAvoid, foodToEat, foodToAvoid, lifestyle, exercise, reasons, consultDoctorWhen, disclaimer.";

  const prompt = ["Report text:", extractedText.slice(0, 18000)].join("\n");

  try {
    const res = await openai.responses.create({
      model: env.OPENAI_MODEL,
      instructions,
      input: prompt,
      temperature: 0.2
    });

    const text = res.output_text?.trim() ?? "";
    const json = safeJsonParse(text);
    return InterpretationSchema.parse(json);
  } catch (err) {
    if (err instanceof OpenAI.APIError && err.status === 429) {
      return demoInterpretation(extractedText, {
        note:
          "AI quota is currently unavailable for this project (OpenAI returned HTTP 429). Showing a demo interpretation."
      });
    }
    throw err;
  }
}

function safeJsonParse(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) throw new Error("Model did not return JSON");
  return JSON.parse(text.slice(start, end + 1));
}

function demoInterpretation(
  extractedText: string,
  opts?: { note?: string }
): Interpretation {
  const findings = inferAbnormalFindings(extractedText).slice(0, 12);
  const explanation = [
    "## Demo medical report explanation",
    "",
    "I can help explain what your report *might* mean in simple language.",
    "This is a **demo mode** summary (no live AI call).",
    findings.length ? "" : "",
    findings.length ? "### Possible abnormal values spotted" : "### I couldn’t reliably identify abnormal values",
    findings.length
      ? findings.map((f) => `- **${f.parameter}:** ${f.value} (${f.flag})${f.note ? ` — ${f.note}` : ""}`).join("\n")
      : "- If your report has reference ranges/flags (H/L), upload a clearer image or a digital PDF for better parsing.",
    "",
    "### What this generally means",
    "- Abnormal values can happen for many reasons (hydration, diet, recent illness, medicines, lab variation).",
    "- A single report rarely tells the full story—trends over time and symptoms matter.",
    "",
    "### What to do now (safe basics)",
    "- If you feel unwell, keep notes: symptoms, duration, fever, pain, breathlessness, dizziness.",
    "- Stay hydrated unless your doctor told you to restrict fluids.",
    "- Avoid self-changing prescription medicines based on a report alone.",
    "",
    "### When to consult a real doctor urgently",
    "- Chest pain, severe shortness of breath, fainting, confusion, severe weakness, uncontrolled bleeding.",
    "- Very high fever, severe dehydration, or rapidly worsening symptoms.",
    "",
    opts?.note ? `> Note: ${opts.note}` : "",
    "",
    "**Disclaimer:** This tool provides educational information and is not a medical diagnosis. For urgent concerns, contact local emergency services."
  ]
    .filter(Boolean)
    .join("\n");

  return InterpretationSchema.parse({
    abnormalFindings: findings,
    explanationMarkdown: explanation,
    whatToDo: ["Track symptoms and share with your clinician", "Repeat tests if your doctor recommends", "Follow any existing treatment plan"],
    whatToAvoid: ["Do not self-diagnose from one report", "Do not change prescriptions without a clinician"],
    foodToEat: ["Balanced meals with protein + fiber", "Fruits/vegetables (as tolerated)", "Adequate water (unless restricted)"],
    foodToAvoid: ["Excess alcohol", "Highly processed foods if managing sugar/lipids"],
    lifestyle: ["Sleep 7–9 hours", "Daily light activity if safe", "Stress reduction (walks, breathing)"],
    exercise: ["Light walking 15–30 minutes (if no red flags)", "Gentle stretching"],
    reasons: ["Hydration status", "Recent infection/inflammation", "Diet and timing of test", "Medication effects", "Lab variability"],
    consultDoctorWhen: ["If values are flagged critical on the report", "If symptoms are worsening", "If you have pregnancy, heart disease, kidney disease, diabetes"],
    disclaimer: "Educational only; not medical advice or diagnosis."
  });
}

function inferAbnormalFindings(text: string): Array<{
  parameter: string;
  value: string;
  flag: "low" | "high" | "critical";
  note?: string;
}> {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 400);

  const out: Array<{ parameter: string; value: string; flag: "low" | "high" | "critical"; note?: string }> = [];
  const seen = new Set<string>();

  for (const line of lines) {
    const m = line.match(
      /^(?<param>[A-Za-z][A-Za-z0-9 %()\/\-\.,]{1,60}?)\s+(?<value>[-+]?\d+(?:\.\d+)?(?:\s*[A-Za-z/%µμ\-\d\.]+)?)\s*(?<flag>\bH\b|\bL\b|\bHIGH\b|\bLOW\b|\bCRITICAL\b)/i
    );
    const groups = m?.groups as Partial<Record<"param" | "value" | "flag", string>> | undefined;
    if (!groups?.param || !groups.value || !groups.flag) continue;
    const param = groups.param.trim().replace(/\s{2,}/g, " ");
    const value = groups.value.trim().replace(/\s{2,}/g, " ");
    const flagRaw = groups.flag.toLowerCase();
    const flag: "low" | "high" | "critical" =
      flagRaw.includes("critical") ? "critical" : flagRaw === "l" || flagRaw.includes("low") ? "low" : "high";
    const key = `${param}:${flag}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ parameter: param, value, flag, note: `From line: "${line.slice(0, 120)}"` });
  }

  return out;
}
