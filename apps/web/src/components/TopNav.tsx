"use client";

import Link from "next/link";
import { Stethoscope } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/AuthProvider";

export function TopNav() {
  const { user, logout } = useAuth();
  return (
    <header className="print-hidden sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="rounded-xl bg-brand-600 p-2 text-white">
            <Stethoscope className="h-5 w-5" />
          </span>
          <span className="hidden sm:inline">AI Medical Report Interpreter</span>
          <span className="sm:hidden">AI Doctor</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <>
              <Link href="/dashboard">
                <Button variant="secondary">Dashboard</Button>
              </Link>
              <Button variant="ghost" onClick={() => logout()}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/auth/signup">
                <Button>Sign up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
