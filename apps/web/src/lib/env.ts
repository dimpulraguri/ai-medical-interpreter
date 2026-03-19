function normalizeApiBaseUrl(raw: string) {
  const trimmed = raw.trim().replace(/\/+$/, "");
  // Users often paste the API prefix; we expect the server origin only.
  return trimmed.replace(/\/api$/i, "");
}

export const env = {
  apiBaseUrl: normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8090")
};
