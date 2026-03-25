import { env } from "../config/env.js";
import { requireOpenAI } from "./openaiClient.js";
import OpenAI from "openai";
import { hfGenerateText } from "./huggingface.js";

export async function doctorChatReply(input: {
  userMessage: string;
  recent: Array<{ role: "user" | "assistant"; content: string }>;
  context?: { recentAbnormalFindings?: unknown; recentReportSummary?: { filename: string; createdAt: string; aiExplanation: string; extractedText: string } | null };
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
  if (env.AI_MODE === "huggingface") {
    const system = [
      "You are an empathetic, safety-first medical assistant (not a doctor).",
      "You provide: simple explanations, self-care guidance, when-to-seek-care advice, and medication-safety reminders.",
      "Ask clarifying questions when needed (age, duration, pregnancy, chronic diseases, meds, allergies).",
      "Never provide definitive diagnosis. Never provide dosing changes. Encourage consulting a clinician for emergencies."
    ].join(" ");

    const contextText =
      context?.recentAbnormalFindings != null
        ? `Recent lab abnormal findings (may be incomplete): ${JSON.stringify(context.recentAbnormalFindings).slice(
            0,
            600
          )}`
        : "";

    const history = recent
      .slice(-8)
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n");

    const prompt = [
      system,
      contextText,
      "",
      "Conversation (most recent last):",
      history,
      "",
      `USER: ${userMessage}`,
      "ASSISTANT:"
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const out = await hfGenerateText({ prompt, maxNewTokens: 350, temperature: 0.4 });
      return out.trim() || demoChatReply({ userMessage, context, note: "HuggingFace returned an empty reply." });
    } catch (err: any) {
      const detail = typeof err?.message === "string" ? err.message : "HuggingFace failed";
      return demoChatReply({ userMessage, context, note: `${detail} Answering in demo mode.` });
    }
  }

  const openai = requireOpenAI();
  const system = [
    "You are an empathetic, safety-first medical assistant (not a doctor).",
    "You provide: simple explanations, self-care guidance, when-to-seek-care advice, and medication-safety reminders.",
    "You must ask clarifying questions when needed (age, duration, pregnancy, chronic diseases, meds, allergies).",
    "Never provide definitive diagnosis. Never provide dosing changes. Encourage consulting a clinician for emergencies.",
    "If severe red flags: advise urgent care / emergency services."
  ].join(" ");

  const abnormalText =
    context?.recentAbnormalFindings != null
      ? `Recent lab abnormal findings (may be incomplete): ${JSON.stringify(context.recentAbnormalFindings).slice(
          0,
          1000
        )}`
      : "";
  const reportText = context?.recentReportSummary
    ? [
        `Latest report: ${context.recentReportSummary.filename} (${context.recentReportSummary.createdAt})`,
        context.recentReportSummary.aiExplanation ? `AI summary: ${context.recentReportSummary.aiExplanation.slice(0, 1200)}` : "",
        context.recentReportSummary.extractedText ? `Raw report text (excerpt): ${context.recentReportSummary.extractedText.slice(0, 800)}` : ""
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  const instructions = [system, abnormalText, reportText].filter(Boolean).join("\n");

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

export async function reportChatReply(input: {
  userMessage: string;
  reportSummary?: { filename: string; createdAt: string; aiExplanation: string; extractedText: string } | null;
  abnormalFindings?: unknown;
}) {
  const { userMessage, reportSummary, abnormalFindings } = input;

  if (!reportSummary) {
    return "I couldnâ€™t find a ready report. Please upload a report or select one to analyze.";
  }

  if (env.AI_MODE === "off") {
    const err = new Error("AI is disabled by the server.");
    (err as any).statusCode = 503;
    throw err;
  }

  const reportContext = [
    `Report: ${reportSummary.filename} (${reportSummary.createdAt})`,
    reportSummary.aiExplanation ? `AI summary: ${reportSummary.aiExplanation.slice(0, 1400)}` : "",
    reportSummary.extractedText ? `Raw report text (excerpt): ${reportSummary.extractedText.slice(0, 900)}` : ""
  ]
    .filter(Boolean)
    .join("\n");

  const abnormalText =
    abnormalFindings != null
      ? `Abnormal findings (may be incomplete): ${JSON.stringify(abnormalFindings).slice(0, 1000)}`
      : "";

  if (env.AI_MODE === "demo") {
    return [
      "Iâ€™m here to explain your report in simple language (demo mode).",
      reportContext,
      abnormalText ? `\n${abnormalText}` : "",
      "\nAsk me anything about these results (e.g., â€œwhat does low hemoglobin mean?â€�).",
      "Disclaimer: Educational information only; not medical advice."
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (env.AI_MODE === "huggingface") {
    const system = [
      "You are a medical-report assistant (not a doctor).",
      "Only answer using the provided report context.",
      "Explain in simple English, highlight highs/lows/critical, and suggest safe next steps.",
      "Do not diagnose. Encourage seeing a clinician for urgent or unclear results."
    ].join(" ");

    const prompt = [system, reportContext, abnormalText, `USER: ${userMessage}`, "ASSISTANT:"].filter(Boolean).join("\n");

    try {
      const out = await hfGenerateText({ prompt, maxNewTokens: 350, temperature: 0.4 });
      return out.trim() || "Iâ€™m here to explain your report. Can you rephrase your question?";
    } catch (err: any) {
      const detail = typeof err?.message === "string" ? err.message : "HuggingFace failed";
      return `Iâ€™m here to explain your report (demo mode). Note: ${detail}`;
    }
  }

  const openai = requireOpenAI();
  const instructions = [
    "You are a medical-report assistant (not a doctor).",
    "Only answer using the provided report context.",
    "Explain in simple English, highlight highs/lows/critical, and suggest safe next steps.",
    "Do not diagnose. Encourage seeing a clinician for urgent or unclear results.",
    reportContext,
    abnormalText
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const res = await openai.responses.create({
      model: env.OPENAI_MODEL,
      instructions,
      input: [{ role: "user", content: userMessage }],
      temperature: 0.3
    });
    return (res.output_text ?? "").trim();
  } catch (err) {
    if (err instanceof OpenAI.APIError && err.status === 429) {
      return "AI quota is currently unavailable. Iâ€™m in demo mode for report explanations.";
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
