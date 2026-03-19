export type Id = string;

export type ApiError = {
  error: string;
  details?: unknown;
};

export type AuthUser = {
  id: Id;
  email: string;
  name: string;
  role: "user" | "admin";
  createdAt: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type ReportStatus = "uploaded" | "processing" | "ready" | "failed";

export type ReportSummary = {
  id: Id;
  filename: string;
  status: ReportStatus;
  createdAt: string;
};

export type ReportDetail = ReportSummary & {
  extractedText?: string;
  aiExplanation?: string;
  abnormalFindings?: Array<{
    parameter: string;
    value: string;
    flag: "low" | "high" | "critical";
    note?: string;
  }>;
};

export type ReminderType =
  | "water"
  | "medicine"
  | "diet"
  | "exercise"
  | "disease"
  | "custom";

export type ReminderFrequency = "daily" | "weekly" | "monthly";

export type Reminder = {
  id: Id;
  type: ReminderType;
  title: string;
  message?: string;
  frequency: ReminderFrequency;
  times: string[]; // ["09:00","18:00"] local time
  enabled: boolean;
  createdAt: string;
};

export type MedicineSchedule = {
  id: Id;
  name: string;
  dosage: string;
  times: string[];
  startDate: string; // YYYY-MM-DD
  durationDays: number;
  enabled: boolean;
  createdAt: string;
};

export type MedicineLog = {
  id: Id;
  scheduleId: Id;
  plannedAt: string; // ISO
  status: "taken" | "skipped";
  loggedAt: string; // ISO
};

export type ChatMessage = {
  id: Id;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type DashboardSummary = {
  reportsCount: number;
  abnormalCount: number;
  adherencePct: number | null;
  todayReminders: Array<{
    id: Id;
    title: string;
    time: string; // "09:00"
    type: ReminderType;
  }>;
};
