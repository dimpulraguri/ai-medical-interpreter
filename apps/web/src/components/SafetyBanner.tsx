"use client";

import * as React from "react";
import { AlertTriangle, Siren } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { detectSafety } from "@/lib/safety";

type Finding = { flag: "low" | "high" | "critical" };

export function SafetyBanner(props: { text?: string; findings?: Finding[] }) {
  const text = props.text ?? "";
  const findings = props.findings ?? [];
  const hasCritical = findings.some((f) => f.flag === "critical");
  const { level, hits } = detectSafety(text);

  const finalLevel = hasCritical ? "danger" : level;
  if (finalLevel === "none") return null;

  const tone =
    finalLevel === "danger"
      ? {
          icon: Siren,
          title: "Urgent care warning",
          className:
            "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-100",
          msg:
            "If you have severe symptoms (chest pain, severe shortness of breath, fainting, confusion, stroke signs), seek urgent medical care / emergency services."
        }
      : {
          icon: AlertTriangle,
          title: "Safety reminder",
          className:
            "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-100",
          msg:
            "If symptoms worsen, persist, or you have pregnancy/chronic conditions, consider consulting a clinician."
        };

  const Icon = tone.icon;
  const chips = hasCritical ? ["Critical lab flag"] : hits;

  return (
    <Card className={cn("print-hidden border p-4", tone.className)}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-xl bg-white/60 p-2 dark:bg-black/20">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">{tone.title}</div>
          <div className="mt-1 text-sm opacity-90">{tone.msg}</div>
          {!!chips.length && (
            <div className="mt-2 flex flex-wrap gap-2">
              {chips.slice(0, 4).map((c) => (
                <span
                  key={c}
                  className="rounded-full border border-black/10 bg-white/70 px-2 py-0.5 text-xs font-medium dark:border-white/10 dark:bg-black/20"
                >
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

