"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SafetyBanner } from "@/components/SafetyBanner";

type Finding = { parameter: string; value: string; flag: "low" | "high" | "critical"; note?: string };

export default function ReportDetailPage() {
  const params = useParams<{ id: string }>();
  const [chatLinked, setChatLinked] = React.useState(false);
  const q = useQuery({
    queryKey: ["report", params.id],
    queryFn: async () => (await api.get(`/reports/${params.id}`)).data.report as any
  });

  const report = q.data;
  const findings: Finding[] = Array.isArray(report?.abnormalFindings) ? report.abnormalFindings : [];

  function flagBadge(flag: Finding["flag"]) {
    if (flag === "critical") return <Badge variant="danger">Critical</Badge>;
    if (flag === "high") return <Badge variant="warn">High</Badge>;
    return <Badge variant="warn">Low</Badge>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold">{report?.filename ?? "Report"}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">AI explanation + abnormal highlights.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              localStorage.setItem("ami_chat_report_id", params.id);
              setChatLinked(true);
            }}
          >
            Use in chat
          </Button>
          <Link href={`/dashboard/reports/${params.id}/summary`}>
            <Button variant="secondary">Doctor summary</Button>
          </Link>
        </div>
      </div>
      {chatLinked && <div className="text-sm text-emerald-600">Chat will use this report for context.</div>}

      <SafetyBanner findings={findings} text={String(report?.aiExplanation ?? "")} />

      {report?.status !== "ready" && (
        <Card>
          <div className="text-sm">
            Status: <span className="font-medium">{report?.status ?? "—"}</span>
          </div>
          <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            If processing, refresh after a minute. If failed, try a clearer image or a digital PDF.
          </div>
        </Card>
      )}

      {!!findings.length && (
        <Card>
          <div className="text-sm font-semibold">Abnormal findings</div>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs text-slate-500">
                <tr>
                  <th className="py-2 pr-4">Parameter</th>
                  <th className="py-2 pr-4">Value</th>
                  <th className="py-2 pr-4">Flag</th>
                  <th className="py-2">Note</th>
                </tr>
              </thead>
              <tbody>
                {findings.map((f, idx) => (
                  <tr key={idx} className="border-t border-slate-200 dark:border-slate-800">
                    <td className="py-2 pr-4 font-medium">{f.parameter}</td>
                    <td className="py-2 pr-4">{f.value}</td>
                    <td className="py-2 pr-4">{flagBadge(f.flag)}</td>
                    <td className="py-2 text-slate-600 dark:text-slate-300">{f.note ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {!!report?.aiExplanation && (
        <Card className="prose max-w-none prose-slate dark:prose-invert">
          <ReactMarkdown>{String(report.aiExplanation)}</ReactMarkdown>
        </Card>
      )}
    </div>
  );
}
