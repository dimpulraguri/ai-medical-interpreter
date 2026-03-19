"use client";

import Link from "next/link";
import * as React from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/components/AuthProvider";
import { SafetyBanner } from "@/components/SafetyBanner";

type Finding = { parameter: string; value: string; flag: "low" | "high" | "critical"; note?: string };

export default function ReportSummaryPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
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

  const createdAt = report?.createdAt ? new Date(report.createdAt) : null;

  return (
    <div className="space-y-4">
      <div className="print-hidden flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold">Doctor Summary</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Print or save as PDF for sharing with a clinician.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/dashboard/reports/${params.id}`}>
            <Button variant="secondary">Back</Button>
          </Link>
          <Button onClick={() => window.print()}>Download PDF</Button>
        </div>
      </div>

      <SafetyBanner
        findings={findings}
        text={[String(report?.aiExplanation ?? ""), String(report?.extractedText ?? "")].join("\n")}
      />

      <Card className="print-area">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-lg font-semibold">Medical Report Summary</div>
            <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Patient: <span className="font-medium text-slate-900 dark:text-slate-100">{user?.name ?? "—"}</span>
              {" · "}
              Email: <span className="font-medium">{user?.email ?? "—"}</span>
            </div>
            <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              File: <span className="font-medium">{report?.filename ?? "—"}</span>
              {createdAt ? (
                <>
                  {" · "}Uploaded: <span className="font-medium">{createdAt.toLocaleString()}</span>
                </>
              ) : null}
            </div>
          </div>
          <div className="text-right text-xs text-slate-500">
            <div className="font-medium">AI Medical Report Interpreter</div>
            <div>Informational only</div>
          </div>
        </div>

        {!!findings.length && (
          <div className="mt-6">
            <div className="text-sm font-semibold">Key abnormal findings</div>
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
          </div>
        )}

        {!!report?.aiExplanation && (
          <div className="prose prose-slate mt-6 max-w-none dark:prose-invert">
            <ReactMarkdown>{String(report.aiExplanation)}</ReactMarkdown>
          </div>
        )}

        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200">
          <div className="font-semibold">Medical disclaimer</div>
          <div className="mt-1">
            This summary is educational and not a medical diagnosis. If you have severe symptoms (chest pain, severe
            shortness of breath, fainting, confusion, stroke signs), seek urgent medical care.
          </div>
        </div>
      </Card>
    </div>
  );
}

