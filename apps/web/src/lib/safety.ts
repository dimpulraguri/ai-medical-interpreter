export type SafetyLevel = "none" | "warn" | "danger";

const DANGER_PATTERNS: Array<{ re: RegExp; label: string }> = [
  { re: /\bchest pain\b/i, label: "Chest pain" },
  { re: /\b(shortness of breath|difficulty breathing|can't breathe)\b/i, label: "Breathing difficulty" },
  { re: /\b(faint(ed|ing)?|passed out|unconscious)\b/i, label: "Fainting/unconsciousness" },
  { re: /\b(seizure|fit)\b/i, label: "Seizure" },
  { re: /\b(stroke|face droop|arm weakness|slurred speech)\b/i, label: "Stroke signs" },
  { re: /\b(severe bleeding|vomit(ing)? blood|blood in stool|black stool)\b/i, label: "Severe bleeding" },
  { re: /\b(suicidal|self-harm)\b/i, label: "Self-harm risk" }
];

const WARN_PATTERNS: Array<{ re: RegExp; label: string }> = [
  { re: /\b(high fever|fever\s*(\>|\≥)?\s*103)\b/i, label: "High fever" },
  { re: /\b(severe headache|worst headache)\b/i, label: "Severe headache" },
  { re: /\b(pregnan(t|cy))\b/i, label: "Pregnancy" },
  { re: /\b(diabetes|bp|blood pressure|hypertension|asthma|kidney|liver|heart disease)\b/i, label: "Chronic condition" }
];

export function detectSafety(text: string | null | undefined): { level: SafetyLevel; hits: string[] } {
  const t = String(text ?? "");
  const dangerHits = DANGER_PATTERNS.filter((p) => p.re.test(t)).map((p) => p.label);
  if (dangerHits.length) return { level: "danger", hits: dangerHits };
  const warnHits = WARN_PATTERNS.filter((p) => p.re.test(t)).map((p) => p.label);
  if (warnHits.length) return { level: "warn", hits: warnHits };
  return { level: "none", hits: [] };
}

