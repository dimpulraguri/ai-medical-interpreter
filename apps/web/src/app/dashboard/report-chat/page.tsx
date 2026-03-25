"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/errors";

type ChatMsg = { id: string; role: "user" | "assistant"; content: string; createdAt: string };
type ReportItem = { id: string; filename: string; status: string; createdAt: string };

export default function ReportChatPage() {
  const [text, setText] = React.useState("");
  const [messages, setMessages] = React.useState<ChatMsg[]>([]);
  const [sending, setSending] = React.useState(false);
  const [reportId, setReportId] = React.useState<string | null>(null);
  const endRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    setReportId(localStorage.getItem("ami_chat_report_id"));
  }, []);

  const reportsQ = useQuery({
    queryKey: ["reports"],
    queryFn: async () => (await api.get("/reports")).data.reports as ReportItem[]
  });

  const reportQ = useQuery({
    queryKey: ["report", reportId],
    enabled: !!reportId,
    queryFn: async () => (await api.get(`/reports/${reportId}`)).data.report as any
  });

  React.useEffect(() => {
    if (!reportId) {
      setMessages([]);
      return;
    }
    const raw = localStorage.getItem(`ami_report_chat_${reportId}`);
    if (raw) {
      try {
        setMessages(JSON.parse(raw) as ChatMsg[]);
      } catch {
        setMessages([]);
      }
    } else {
      setMessages([]);
    }
  }, [reportId]);

  React.useEffect(() => {
    if (!reportId) return;
    localStorage.setItem(`ami_report_chat_${reportId}`, JSON.stringify(messages.slice(-50)));
  }, [messages, reportId]);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function onSend() {
    const v = text.trim();
    if (!v) return;
    setText("");
    if (!reportId) {
      setMessages((m) => [
        ...m,
        { id: `err_${Date.now()}`, role: "assistant", content: "Please select a report first.", createdAt: new Date().toISOString() }
      ]);
      return;
    }

    setSending(true);
    const temp: ChatMsg = { id: `tmp_${Date.now()}`, role: "user", content: v, createdAt: new Date().toISOString() };
    setMessages((m) => [...m, temp]);
    try {
      const r = await api.post("/reports/chat", { message: v, reportId });
      const reply: ChatMsg = { id: `asst_${Date.now()}`, role: "assistant", content: r.data.message, createdAt: r.data.createdAt };
      setMessages((m) => [...m, reply]);
    } catch (err) {
      const msg = getApiErrorMessage(err);
      setMessages((m) => [
        ...m,
        { id: `err_${Date.now()}`, role: "assistant", content: msg, createdAt: new Date().toISOString() }
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Report Assistant</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Ask questions about a specific report only (separate from doctor chat).
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <div className="text-slate-600 dark:text-slate-300">Selected report:</div>
          <select
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm dark:border-slate-800 dark:bg-slate-950"
            value={reportId ?? ""}
            onChange={(e) => {
              const id = e.target.value || null;
              setReportId(id);
              if (id) localStorage.setItem("ami_chat_report_id", id);
              else localStorage.removeItem("ami_chat_report_id");
            }}
          >
            <option value="">Choose a report</option>
            {(reportsQ.data ?? []).map((r) => (
              <option key={r.id} value={r.id}>
                {r.filename} {r.status !== "ready" ? `(${r.status})` : ""}
              </option>
            ))}
          </select>
          <Link href="/dashboard/reports" className="text-brand-700 underline">
            Manage reports
          </Link>
        </div>
        {!reportId && (
          <div className="mt-1 text-xs text-slate-500">
            Open a report and click “Use in chat” to set the active report.
          </div>
        )}
      </div>

      {reportId && reportQ.data && (
        <Card className="space-y-2">
          <div className="text-sm font-semibold">Selected report context</div>
          <div className="text-sm text-slate-600 dark:text-slate-300">
            {reportQ.data.filename} • {new Date(reportQ.data.createdAt).toLocaleString()}
          </div>
          {Array.isArray(reportQ.data.abnormalFindings) && reportQ.data.abnormalFindings.length > 0 && (
            <div className="text-xs text-slate-500">
              Abnormal findings: {reportQ.data.abnormalFindings.length}
            </div>
          )}
          {reportQ.data.aiExplanation && (
            <div className="text-sm text-slate-700 dark:text-slate-200">
              {String(reportQ.data.aiExplanation).slice(0, 400)}
              {String(reportQ.data.aiExplanation).length > 400 ? "…" : ""}
            </div>
          )}
        </Card>
      )}

      <Card className="flex h-[70vh] flex-col p-0">
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "max-w-[90%] rounded-2xl px-3 py-2 text-sm",
                  m.role === "user"
                    ? "ml-auto bg-brand-600 text-white"
                    : "mr-auto bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                )}
              >
                {m.content}
              </div>
            ))}
            {sending && (
              <div className="mr-auto max-w-[90%] rounded-2xl bg-slate-100 px-3 py-2 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                Typing…
              </div>
            )}
            <div ref={endRef} />
          </div>
        </div>
        <div className="border-t border-slate-200 p-3 dark:border-slate-800">
          <div className="flex gap-2">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ask about this report…"
              onKeyDown={(e) => e.key === "Enter" && onSend()}
            />
            <Button onClick={onSend} disabled={sending}>
              Send
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
