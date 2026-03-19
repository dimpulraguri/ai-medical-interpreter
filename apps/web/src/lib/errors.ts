import type { AxiosError } from "axios";

export function getApiErrorMessage(err: unknown) {
  const ax = err as AxiosError<any>;
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
