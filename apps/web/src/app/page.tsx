import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function HomePage() {
  return (
    <main>
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div className="space-y-4">
            <Badge className="w-fit" variant="info">
              24/7 Virtual Doctor-style assistant
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
              AI Medical Report Interpreter
              <span className="block text-brand-700 dark:text-brand-300">Your 24/7 Virtual Doctor</span>
            </h1>
            <p className="text-slate-600 dark:text-slate-300">
              Upload a PDF or photo of your lab report, get abnormal values highlighted, and understand what it might
              mean in simple language—with safe, practical next steps.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/auth/signup">
                <Button className="w-full sm:w-auto">Upload Report</Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="secondary" className="w-full sm:w-auto">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
            <p className="text-xs text-slate-500">
              Disclaimer: This app provides informational guidance and does not replace professional medical advice.
            </p>
          </div>
          <Card className="p-6">
            <div className="space-y-3">
              <div className="text-sm font-medium">What you’ll get</div>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li>• Abnormal values flagged as high/low/critical</li>
                <li>• Simple English explanation + what to do next</li>
                <li>• Water/medicine/diet/exercise reminders</li>
                <li>• A 24/7 chatbox for questions (safety-first)</li>
              </ul>
            </div>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <h2 className="text-xl font-semibold">Features</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Secure login", "JWT-based auth and protected routes."],
            ["Report upload", "PDF/JPG/PNG upload with text extraction (OCR)."],
            ["AI explanation", "Simple summary with safe next steps and red flags."],
            ["Reminders", "Water, medicine, diet, exercise, disease-based reminders."],
            ["Medicine schedule", "Track taken/skipped and adherence percentage."],
            ["Dashboard", "Trends, reminders for today, and trackers."]
          ].map(([title, desc]) => (
            <Card key={title}>
              <div className="text-sm font-semibold">{title}</div>
              <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{desc}</div>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <h2 className="text-xl font-semibold">Testimonials</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {[
            ["“Finally understood my lab report.”", "Explained in simple words and told me when to consult my doctor."],
            ["“Reminders keep me on track.”", "Medicine + water reminders helped my routine."],
            ["“Chat feels supportive.”", "It asks the right questions and keeps safety first."]
          ].map(([q, a]) => (
            <Card key={q}>
              <div className="text-sm font-medium">{q}</div>
              <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{a}</div>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <h2 className="text-lg font-semibold">About</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Built to help you understand health reports quickly and safely. Your data is encrypted in the database,
              and uploads are stored encrypted at rest.
            </p>
          </Card>
          <Card>
            <h2 className="text-lg font-semibold">How it works</h2>
            <ol className="mt-2 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li>1. Upload a report (PDF or photo)</li>
              <li>2. We extract text and highlight abnormal values</li>
              <li>3. Get a simple explanation and next-step guidance</li>
              <li>4. Track reminders and stay consistent</li>
            </ol>
          </Card>
        </div>
      </section>
    </main>
  );
}
