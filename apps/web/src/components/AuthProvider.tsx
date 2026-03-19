"use client";

import * as React from "react";
import type { AuthUser, AuthTokens } from "@ami/shared";
import { api } from "@/lib/api";
import { clearTokens, getTokens, setTokens } from "@/lib/storage";

type AuthState = {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, acceptTerms: boolean) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthCtx = React.createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [tokens, setTokensState] = React.useState<AuthTokens | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const existing = getTokens();
    if (!existing) {
      setLoading(false);
      return;
    }
    setTokensState(existing);
    api
      .get("/auth/me")
      .then((r) => setUser(r.data.user))
      .catch(() => {
        clearTokens();
        setUser(null);
        setTokensState(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const r = await api.post("/auth/login", { email, password });
    const t = r.data.tokens as AuthTokens;
    setTokens(t);
    setTokensState(t);
    setUser(r.data.user as AuthUser);
  }

  async function signup(name: string, email: string, password: string, acceptTerms: boolean) {
    const r = await api.post("/auth/signup", { name, email, password, acceptTerms });
    const t = r.data.tokens as AuthTokens;
    setTokens(t);
    setTokensState(t);
    setUser(r.data.user as AuthUser);
  }

  async function logout() {
    try {
      await api.post("/auth/logout");
    } finally {
      clearTokens();
      setTokensState(null);
      setUser(null);
    }
  }

  return (
    <AuthCtx.Provider value={{ user, tokens, loading, login, signup, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = React.useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
