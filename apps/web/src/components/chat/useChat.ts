"use client";

import * as React from "react";
import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/errors";

export type ChatMsg = { id: string; role: "user" | "assistant"; content: string; createdAt: string };

export function useChat() {
  const [messages, setMessages] = React.useState<ChatMsg[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [sending, setSending] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get("/chat/history");
      setMessages(r.data.messages as ChatMsg[]);
    } finally {
      setLoading(false);
    }
  }, []);

  const send = React.useCallback(async (text: string) => {
    setSending(true);
    const temp: ChatMsg = { id: `tmp_${Date.now()}`, role: "user", content: text, createdAt: new Date().toISOString() };
    setMessages((m) => [...m, temp]);
    try {
      const reportId = typeof window !== "undefined" ? localStorage.getItem("ami_chat_report_id") : null;
      const r = await api.post("/chat/send", { message: text, reportId: reportId || undefined });
      const reply: ChatMsg = { id: `asst_${Date.now()}`, role: "assistant", content: r.data.message, createdAt: r.data.createdAt };
      setMessages((m) => [...m, reply]);
    } catch (err) {
      const msg = getApiErrorMessage(err);
      setMessages((m) => [
        ...m,
        {
          id: `err_${Date.now()}`,
          role: "assistant",
          content:
            msg.includes("OpenAI is not configured")
              ? "AI is not configured on the server yet. Set OPENAI_API_KEY in apps/api/.env and restart the API."
              : msg,
          createdAt: new Date().toISOString()
        }
      ]);
    } finally {
      setSending(false);
    }
  }, []);

  return { messages, setMessages, load, loading, send, sending };
}
