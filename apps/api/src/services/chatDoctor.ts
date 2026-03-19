import { env } from "../config/env.js";
import { requireOpenAI } from "./openaiClient.js";
import OpenAI from "openai";

export async function doctorChatReply(input: {
  userMessage: string;
  recent: Array<{ role: "user" | "assistant"; content: string }>;
  context?: { recentAbnormalFindings?: unknown };
}) {
  const { userMessage, recent, context } = input;

  if (env.AI_MODE === "off") {
    const err = new Error("AI is disabled by the server.");
    (err as any).statusCode = 503;
    throw err;
  }
  if (env.AI_MODE === "demo") {
    return demoChatReply({ userMessage, context });
  }

  const openai = requireOpenAI();
  const system = [
    "You are an empathetic, safety-first medical assistant (not a doctor).",
    "You provide: simple explanations, self-care guidance, when-to-seek-care advice, and medication-safety reminders.",
    "You must ask clarifying questions when needed (age, duration, pregnancy, chronic diseases, meds, allergies).",
    "Never provide definitive diagnosis. Never provide dosing changes. Encourage consulting a clinician for emergencies.",
    "If severe red flags: advise urgent care / emergency services."
  ].join(" ");

  const contextText =
    context?.recentAbnormalFindings != null
      ? `Recent lab abnormal findings (may be incomplete): ${JSON.stringify(context.recentAbnormalFindings).slice(
          0,
          1000
        )}`
      : "";

  const instructions = [system, contextText].filter(Boolean).join("\n");

  try {
    const res = await openai.responses.create({
      model: env.OPENAI_MODEL,
      instructions,
      input: [...recent.slice(-12), { role: "user", content: userMessage }],
      temperature: 0.4
    });

    return (res.output_text ?? "").trim();
  } catch (err) {
    if (err instanceof OpenAI.APIError && err.status === 429) {
      return demoChatReply({
        userMessage,
        context,
        note:
          "AI quota is currently unavailable for this project (OpenAI returned HTTP 429). I’m answering in demo mode."
      });
    }
    throw err;
  }
}

function demoChatReply(input: {
  userMessage: string;
  context?: { recentAbnormalFindings?: unknown };
  note?: string;
}) {
  const msg = input.userMessage.trim();
  const hasRedFlag = /\b(chest pain|shortness of breath|faint|unconscious|seizure|stroke|severe bleeding|suicidal)\b/i.test(
    msg
  );

  const base = hasRedFlag
    ? [
        "Your symptoms could be serious.",
        "If you have chest pain, severe shortness of breath, fainting, seizure, stroke-like symptoms, or heavy bleeding, please seek urgent medical care / emergency services now."
      ].join(" ")
    : [
        "I’m here with you. I can help you think through symptoms safely (demo mode).",
        "I can’t diagnose, but I can explain possibilities and when to seek care."
      ].join(" ");

  const questions = [
    "How old are you and what is your sex?",
    "When did this start, and is it getting better or worse?",
    "Any fever, vomiting/diarrhea, chest pain, shortness of breath, fainting, or severe headache?",
    "Any chronic conditions (diabetes/BP/asthma/kidney/liver) or pregnancy?",
    "Current medicines and allergies?"
  ];

  const selfCare = [
    "Rest and hydrate (unless your doctor told you to restrict fluids).",
    "If pain/fever: use only medicines you’ve tolerated before and follow label directions; avoid mixing products with the same ingredient.",
    "Avoid alcohol and avoid starting new supplements while you feel unwell."
  ];

  const contextLine =
    input.context?.recentAbnormalFindings != null
      ? `\n\n(Recent lab flags on file: ${JSON.stringify(input.context.recentAbnormalFindings).slice(0, 300)}…)`
      : "";

  const noteLine = input.note ? `\n\nNote: ${input.note}` : "";

  return (
    [base, "", "A few quick questions:", ...questions.map((q) => `- ${q}`), "", "Safe next steps:", ...selfCare.map((s) => `- ${s}`)]
      .join("\n") +
    contextLine +
    noteLine +
    "\n\nDisclaimer: Educational information only; not medical advice. If you feel very unwell or symptoms worsen, consult a clinician."
  );
}
