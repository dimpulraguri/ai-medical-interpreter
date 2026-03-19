import { cn } from "@/lib/cn";

export function Badge(props: React.HTMLAttributes<HTMLSpanElement> & { variant?: "ok" | "warn" | "danger" | "info" }) {
  const { variant = "info", className, ...rest } = props;
  const styles: Record<string, string> = {
    ok: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
    warn: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
    danger: "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
    info: "bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300"
  };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", styles[variant], className)} {...rest} />;
}

