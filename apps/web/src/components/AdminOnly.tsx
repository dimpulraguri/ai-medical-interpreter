"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export function AdminOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) router.replace("/dashboard");
  }, [loading, user, router]);

  if (loading) return <div className="p-6 text-sm text-slate-500">Loading…</div>;
  if (!user || user.role !== "admin") return null;
  return <>{children}</>;
}

