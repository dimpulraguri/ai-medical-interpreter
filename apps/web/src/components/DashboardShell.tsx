"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { LayoutDashboard, FileText, Bell, Pill, MessageCircle, Activity, Menu } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/AuthProvider";

const items = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/reports", label: "Reports", icon: FileText },
  { href: "/dashboard/reminders", label: "Reminders", icon: Bell },
  { href: "/dashboard/meds", label: "Medicines", icon: Pill },
  { href: "/dashboard/chat", label: "AI Doctor Chat", icon: MessageCircle },
  { href: "/dashboard/tracker", label: "Trackers", icon: Activity }
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [open, setOpen] = React.useState(false);
  const navItems = React.useMemo(
    () => (user?.role === "admin" ? [...items, { href: "/dashboard/admin", label: "Admin", icon: LayoutDashboard }] : items),
    [user?.role]
  );

  return (
    <div className="mx-auto grid max-w-6xl gap-4 px-4 py-6 lg:grid-cols-[260px_1fr]">
      <aside className="hidden lg:block">
        <nav className="sticky top-20 space-y-1 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="px-2 pb-2 text-sm font-semibold">Hi, {user?.name}</div>
          {navItems.map((it) => {
            const active = pathname === it.href;
            const Icon = it.icon;
            return (
              <Link
                key={it.href}
                href={it.href}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition",
                  active
                    ? "bg-brand-50 text-brand-800 dark:bg-brand-950/40 dark:text-brand-200"
                    : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                )}
              >
                <Icon className="h-4 w-4" />
                {it.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="lg:hidden">
        <Button variant="secondary" className="w-full" onClick={() => setOpen((v) => !v)}>
          <Menu className="mr-2 h-4 w-4" />
          Menu
        </Button>
      {open && (
          <div className="mt-2 rounded-2xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900">
            {navItems.map((it) => {
              const active = pathname === it.href;
              const Icon = it.icon;
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition",
                    active
                      ? "bg-brand-50 text-brand-800 dark:bg-brand-950/40 dark:text-brand-200"
                      : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {it.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <section className="min-w-0">{children}</section>
    </div>
  );
}
