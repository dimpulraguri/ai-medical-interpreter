"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Card>
        <h1 className="text-xl font-semibold">Privacy Policy</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Last updated: {new Date().toISOString().slice(0, 10)}</p>

        <div className="prose prose-slate mt-6 max-w-none dark:prose-invert">
          <h2>What we store</h2>
          <ul>
            <li>Account data: name, email, password hash.</li>
            <li>Uploads and extracted text: stored encrypted at rest in the database/storage layer.</li>
            <li>Chat history: stored encrypted at rest.</li>
            <li>Reminder and medicine schedules: stored for providing notifications.</li>
          </ul>

          <h2>How we use your data</h2>
          <p>
            We use your data to provide the core features (report interpretation, reminders, and chat). We do not sell personal
            data.
          </p>

          <h2>AI processing</h2>
          <p>
            If AI features are enabled, parts of your inputs may be sent to an AI provider for processing. You can run the server
            in demo mode to avoid external AI calls.
          </p>

          <h2>Security</h2>
          <p>
            We use standard security practices (authentication, encryption at rest, and least-privilege access). No system is
            100% secure.
          </p>

          <h2>Your choices</h2>
          <p>
            You can request deletion of your account and associated data via the <Link href="/#contact">Contact</Link> section on
            the homepage.
          </p>
        </div>
      </Card>
    </main>
  );
}

