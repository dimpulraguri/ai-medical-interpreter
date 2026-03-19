"use client";

import * as React from "react";
import { env } from "@/lib/env";

export function ApiStatus() {
  const [status, setStatus] = React.useState<"checking" | "ok" | "fail">("checking");
  const [detail, setDetail] = React.useState<string>("");

  React.useEffect(() => {
    let alive = true;
    const ctrl = new AbortController();
    const t = window.setTimeout(() => ctrl.abort(), 2500);
    fetch(`${env.apiBaseUrl}/health`, { signal: ctrl.signal, cache: "no-store" })
      .then(async (r) => {
        if (!alive) return;
        if (r.ok) {
          setStatus("ok");
          setDetail("");
          return;
        }
        const body = await r.text().catch(() => "");
        setStatus("fail");
        setDetail(`HTTP ${r.status}${body ? `: ${body.slice(0, 120)}` : ""}`);
      })
      .catch((e: any) => {
        if (!alive) return;
        setStatus("fail");
        const msg =
          e?.name === "AbortError"
            ? "Timed out"
            : typeof e?.message === "string"
              ? e.message
              : "Request failed";
        setDetail(msg);
      })
      .finally(() => window.clearTimeout(t));
    return () => {
      alive = false;
      ctrl.abort();
    };
  }, []);

  if (status === "checking") return <div className="text-xs text-slate-500">Checking API connection…</div>;
  if (status === "ok") return <div className="text-xs text-emerald-600">API connected</div>;
  return (
    <div className="text-xs text-rose-600">
      API not reachable at <span className="font-mono">{env.apiBaseUrl}</span>
      {detail ? <span className="text-slate-600 dark:text-slate-300"> — {detail}</span> : null}
      <div className="mt-1 text-slate-600 dark:text-slate-300">
        Check `npm run dev:api` is running and `NEXT_PUBLIC_API_BASE_URL` matches.
      </div>
    </div>
  );
}
