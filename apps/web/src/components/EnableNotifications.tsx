"use client";

import * as React from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { api } from "@/lib/api";
import { getFcmToken } from "@/lib/firebase";

export function EnableNotifications() {
  const [status, setStatus] = React.useState<"idle" | "working" | "enabled" | "unsupported" | "denied">("idle");
  const vapid = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  const missingCfg =
    !process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    !process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    !process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

  async function enable() {
    if (!vapid) return;
    setStatus("working");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return setStatus("denied");
      if ("serviceWorker" in navigator) {
        await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      }
      const token = await getFcmToken(vapid);
      if (!token) return setStatus("unsupported");
      await api.post("/auth/device-token", { token });
      setStatus("enabled");
    } catch {
      setStatus("unsupported");
    }
  }

  if (!vapid || missingCfg) return null;

  return (
    <Card>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold">Push notifications</div>
          <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Enable reminders on this device (requires Firebase Cloud Messaging).
          </div>
        </div>
        <Button variant="secondary" onClick={enable} disabled={status === "working" || status === "enabled"}>
          <Bell className="mr-2 h-4 w-4" />
          {status === "enabled" ? "Enabled" : status === "working" ? "Enabling…" : "Enable"}
        </Button>
      </div>
      {status === "denied" && <div className="mt-2 text-sm text-rose-600">Notifications permission denied in browser settings.</div>}
      {status === "unsupported" && <div className="mt-2 text-sm text-slate-500">Notifications not supported on this browser/device.</div>}
    </Card>
  );
}
