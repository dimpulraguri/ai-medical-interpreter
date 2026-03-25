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

export default function ReportChatPage() {
  const [text, setText] = React.useState("");
  const [messages, setMessages] = React.useState<ChatMsg[]>([]);
  const [sending, setSending] = React.useState(false);
  const [reportId, setReportId] = React.useState<string | null>(null);
  const endRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    setReportId(localStorage.getItem("ami_chat_report_id"));
  }, []);

  const reportQ = useQuery({
    queryKey: ["report", reportId],
    enabled: !!reportId,
    queryFn: async () => (await api.get(`/reports/${reportId}`)).data.report as any
  });

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
        <div className="mt-2 text-sm">
          Selected report:{" "}
          <span className="font-medium">{reportQ.data?.filename ?? "None"}</span>{" "}
          <Link href="/dashboard/reports" className="text-brand-700 underline">
            Choose report
          </Link>
        </div>
        {!reportId && (
          <div className="mt-1 text-xs text-slate-500">
            Open a report and click “Use in chat” to set the active report.
          </div>
        )}
      </div>

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
