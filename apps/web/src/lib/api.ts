import axios from "axios";
import type { AuthTokens } from "@ami/shared";
import { env } from "./env";
import { getTokens, setTokens, clearTokens } from "./storage";

export const api = axios.create({
  baseURL: `${env.apiBaseUrl}/api`,
  timeout: 60_000
});

api.interceptors.request.use((config) => {
  const tokens = getTokens();
  if (tokens?.accessToken) config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  return config;
});

let refreshInFlight: Promise<AuthTokens> | null = null;

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const status = err?.response?.status;
    const original = err?.config;
    if (status !== 401 || !original || original.__isRetry) throw err;

    const tokens = getTokens();
    if (!tokens?.refreshToken) {
      clearTokens();
      throw err;
    }

    refreshInFlight ??= api
      .post("/auth/refresh", { refreshToken: tokens.refreshToken })
      .then((r) => r.data.tokens as AuthTokens)
      .finally(() => {
        refreshInFlight = null;
      });

    const newTokens = await refreshInFlight;
    setTokens(newTokens);
    original.__isRetry = true;
    original.headers.Authorization = `Bearer ${newTokens.accessToken}`;
    return api.request(original);
  }
);

