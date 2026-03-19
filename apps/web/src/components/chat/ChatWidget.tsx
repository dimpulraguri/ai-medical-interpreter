"use client";

import * as React from "react";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import { useChat } from "./useChat";

export function ChatWidget() {
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState("");
  const { messages, load, loading, send, sending } = useChat();
  const endRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (open) load();
  }, [open, load]);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function onSend() {
    const v = text.trim();
    if (!v) return;
    setText("");
    await send(v);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg hover:bg-brand-700"
        aria-label="Open AI Doctor chat"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/30 p-4" onClick={() => setOpen(false)}>
          <Card
            className="mx-auto flex h-[80vh] w-full max-w-lg flex-col p-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
              <div>
                <div className="text-sm font-semibold">AI Doctor Chat</div>
                <div className="text-xs text-slate-500">Safety-first, informational only.</div>
              </div>
              <Button variant="ghost" onClick={() => setOpen(false)} aria-label="Close">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loading && <div className="text-sm text-slate-500">Loading chat…</div>}
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
                <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask about symptoms, diet, reports…" onKeyDown={(e) => e.key === "Enter" && onSend()} />
                <Button onClick={onSend} disabled={sending}>
                  Send
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}

