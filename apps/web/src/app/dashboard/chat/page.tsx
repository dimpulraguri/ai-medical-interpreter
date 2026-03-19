"use client";

import * as React from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { useChat } from "@/components/chat/useChat";
import { SafetyBanner } from "@/components/SafetyBanner";

export default function ChatPage() {
  const [text, setText] = React.useState("");
  const { messages, load, loading, send, sending } = useChat();
  const endRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function onSend() {
    const v = text.trim();
    if (!v) return;
    setText("");
    await send(v);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">24/7 AI Doctor Chat</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Ask about symptoms, diet, medicine doubts, and fitness—with safety-first guidance.
        </p>
      </div>

      <Card className="flex h-[70vh] flex-col p-0">
        <div className="p-3">
          <SafetyBanner text={messages.map((m) => m.content).join("\n")} />
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading && <div className="text-sm text-slate-500">Loading…</div>}
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
              placeholder="Type your question…"
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
