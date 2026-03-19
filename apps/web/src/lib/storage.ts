const ACCESS_KEY = "ami_access";
const REFRESH_KEY = "ami_refresh";

let memoryTokens: { accessToken: string; refreshToken: string } | null = null;

export function getTokens() {
  if (typeof window === "undefined") return null;
  try {
    const accessToken = window.localStorage.getItem(ACCESS_KEY);
    const refreshToken = window.localStorage.getItem(REFRESH_KEY);
    if (!accessToken || !refreshToken) return memoryTokens;
    return { accessToken, refreshToken };
  } catch {
    return memoryTokens;
  }
}

export function setTokens(tokens: { accessToken: string; refreshToken: string }) {
  memoryTokens = tokens;
  try {
    window.localStorage.setItem(ACCESS_KEY, tokens.accessToken);
    window.localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  } catch {
    // ignore (storage disabled)
  }
}

export function clearTokens() {
  memoryTokens = null;
  try {
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
  } catch {
    // ignore
  }
}
