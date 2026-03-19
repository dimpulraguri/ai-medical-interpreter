"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { LayoutDashboard, FileText, Bell, Pill, MessageCircle, Activity, Menu, X } from "lucide-react";
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
  const isActive = React.useCallback(
    (href: string) => pathname === href || pathname.startsWith(`${href}/`),
    [pathname]
  );

  const mobileItems = React.useMemo(() => {
    const byHref = new Map(navItems.map((x) => [x.href, x]));
    const pick = [
      byHref.get("/dashboard"),
      byHref.get("/dashboard/reports"),
      byHref.get("/dashboard/chat"),
      byHref.get("/dashboard/reminders")
    ].filter(Boolean) as typeof navItems;
    return pick;
  }, [navItems]);

  return (
    <div className="mx-auto grid max-w-6xl gap-4 px-4 py-6 pb-24 lg:grid-cols-[260px_1fr] lg:pb-6">
      <aside className="print-hidden hidden lg:block">
        <nav className="sticky top-20 space-y-1 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="px-2 pb-2 text-sm font-semibold">Hi, {user?.name}</div>
          {navItems.map((it) => {
            const active = isActive(it.href);
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

      {open && (
        <div className="print-hidden fixed inset-0 z-50 bg-black/30 p-4 lg:hidden" onClick={() => setOpen(false)}>
          <div
            className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-800 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
              <div className="flex items-center justify-between px-2 py-2">
                <div className="text-sm font-semibold">Menu</div>
                <Button variant="ghost" onClick={() => setOpen(false)} aria-label="Close menu">
                <X className="h-4 w-4" />
                </Button>
              </div>
            {navItems.map((it) => {
              const active = isActive(it.href);
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
        </div>
      )}

      <section className="min-w-0">{children}</section>

      <div className="print-hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 lg:hidden">
        <nav className="mx-auto flex max-w-6xl items-center justify-around px-2 py-2">
          {mobileItems.map((it) => {
            const active = isActive(it.href);
            const Icon = it.icon;
            return (
              <Link
                key={it.href}
                href={it.href}
                className={cn(
                  "flex min-w-[72px] flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-xs",
                  active
                    ? "text-brand-700 dark:text-brand-200"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
                )}
              >
                <Icon className={cn("h-5 w-5", active ? "" : "opacity-90")} />
                <span className="font-medium">{it.label.split(" ")[0]}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex min-w-[72px] flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-xs text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5 opacity-90" />
            <span className="font-medium">More</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
