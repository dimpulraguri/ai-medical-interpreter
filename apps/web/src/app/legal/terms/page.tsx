"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Card>
        <h1 className="text-xl font-semibold">Terms of Service</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Last updated: {new Date().toISOString().slice(0, 10)}</p>

        <div className="prose prose-slate mt-6 max-w-none dark:prose-invert">
          <h2>Medical disclaimer</h2>
          <p>
            This application provides educational information only. It is <strong>not</strong> a substitute for professional
            medical advice, diagnosis, or treatment. If you think you may have a medical emergency, contact your local emergency
            number immediately.
          </p>

          <h2>Use of AI</h2>
          <p>
            AI outputs may be incorrect, incomplete, or misleading. Do not make medical decisions solely based on the app’s
            suggestions.
          </p>

          <h2>Your responsibilities</h2>
          <ul>
            <li>Provide accurate information and use the app for informational purposes.</li>
            <li>Do not upload data you do not have the right to share.</li>
            <li>Keep your account credentials secure.</li>
          </ul>

          <h2>Limitation of liability</h2>
          <p>
            To the maximum extent permitted by law, the app and its contributors are not liable for any damages arising from your
            use of the app.
          </p>

          <h2>Contact</h2>
          <p>
            Questions? See the <Link href="/#contact">Contact</Link> section on the homepage.
          </p>
        </div>
      </Card>
    </main>
  );
}

