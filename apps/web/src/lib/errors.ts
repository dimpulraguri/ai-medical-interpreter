import type { AxiosError } from "axios";
import { env } from "./env";

export function getApiErrorMessage(err: unknown) {
  const ax = err as AxiosError<any>;
  if ((ax as any)?.isAxiosError && !ax?.response) {
    const base = env.apiBaseUrl;
    return `Network error reaching API (${base}). Check NEXT_PUBLIC_API_BASE_URL and that the backend is reachable. If deployed, ensure the API CORS_ORIGIN includes your frontend domain.`;
  }
  const data = ax?.response?.data;
  const msg = data?.message || data?.error || (typeof ax?.message === "string" ? ax.message : null);
  if (typeof msg === "string" && msg.trim()) {
    const code = data?.details?.code;
    const status = data?.details?.status || ax?.response?.status;
    const suffix = code || status ? ` (${[status ? `HTTP ${status}` : null, code ? String(code) : null].filter(Boolean).join(", ")})` : "";
    return `${msg}${suffix}`;
  }
  return "Something went wrong. Please try again.";
}
