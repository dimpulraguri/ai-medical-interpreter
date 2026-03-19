"use client";

import * as React from "react";
import { env } from "@/lib/env";

export function ApiStatus() {
  const [status, setStatus] = React.useState<"checking" | "ok" | "fail">("checking");
  const [detail, setDetail] = React.useState<string>("");
  const pingUrl = `${env.apiBaseUrl}/health`;

  React.useEffect(() => {
    let alive = true;
    const ctrl = new AbortController();
    const t = window.setTimeout(() => ctrl.abort(), 2500);
    fetch(pingUrl, { signal: ctrl.signal, cache: "no-store" })
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
        const raw =
          e?.name === "AbortError"
            ? "Timed out"
            : typeof e?.message === "string"
              ? e.message
              : "Request failed";
        const msg =
          raw.toLowerCase().includes("failed to fetch") || raw.toLowerCase().includes("networkerror")
            ? "Network error (often CORS or wrong URL)"
            : raw;
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
      API not reachable at <span className="font-mono">{pingUrl}</span>
      {detail ? <span className="text-slate-600 dark:text-slate-300"> — {detail}</span> : null}
      <div className="mt-1 text-slate-600 dark:text-slate-300">
        Set `NEXT_PUBLIC_API_BASE_URL` to your API origin (example: https://ai-medical-api.onrender.com). Donâ€™t add `/api`.
      </div>
    </div>
  );
}
