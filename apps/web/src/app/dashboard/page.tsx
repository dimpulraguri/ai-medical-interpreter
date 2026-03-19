"use client";

import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import type { DashboardSummary } from "@ami/shared";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export default function DashboardPage() {
  const summaryQ = useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: async () => (await api.get("/dashboard/summary")).data.summary as DashboardSummary
  });

  const waterQ = useQuery({
    queryKey: ["metrics", "water"],
    queryFn: async () => (await api.get("/metrics/water")).data.water as Array<{ date: string; glasses: number }>
  });

  const weightQ = useQuery({
    queryKey: ["metrics", "weight"],
    queryFn: async () => (await api.get("/metrics/weight")).data.weight as Array<{ date: string; weightKg: number }>
  });

  const water = waterQ.data?.slice(-14) ?? [];
  const weight = weightQ.data?.slice(-14) ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Health Dashboard</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">Today’s snapshot + your recent trends.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="text-xs text-slate-500">Reports</div>
          <div className="mt-1 text-2xl font-semibold">{summaryQ.data?.reportsCount ?? "—"}</div>
        </Card>
        <Card>
          <div className="text-xs text-slate-500">Abnormal history</div>
          <div className="mt-1 text-2xl font-semibold">{summaryQ.data?.abnormalCount ?? "—"}</div>
        </Card>
        <Card>
          <div className="text-xs text-slate-500">Adherence</div>
          <div className="mt-1 text-2xl font-semibold">{summaryQ.data?.adherencePct != null ? `${summaryQ.data.adherencePct}%` : "—"}</div>
        </Card>
        <Card>
          <div className="text-xs text-slate-500">Today’s reminders</div>
          <div className="mt-1 text-2xl font-semibold">{summaryQ.data?.todayReminders?.length ?? "—"}</div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Water intake (last 14 days)</div>
            <Badge variant="info">glasses/day</Badge>
          </div>
          <div className="mt-4 h-64">
            <Line
              data={{
                labels: water.map((x) => x.date.slice(5)),
                datasets: [
                  { label: "Glasses", data: water.map((x) => x.glasses), borderColor: "#2576ea", backgroundColor: "rgba(37,118,234,0.2)" }
                ]
              }}
              options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }}
            />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Weight (last 14 days)</div>
            <Badge variant="info">kg</Badge>
          </div>
          <div className="mt-4 h-64">
            <Line
              data={{
                labels: weight.map((x) => x.date.slice(5)),
                datasets: [
                  { label: "Weight", data: weight.map((x) => x.weightKg), borderColor: "#1f5dd0", backgroundColor: "rgba(31,93,208,0.2)" }
                ]
              }}
              options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }}
            />
          </div>
        </Card>
      </div>

      <Card>
        <div className="text-sm font-semibold">Today’s reminders</div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {(summaryQ.data?.todayReminders ?? []).map((r) => (
            <div key={r.id} className="rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="font-medium">{r.title}</div>
                <Badge variant="info">{r.time}</Badge>
              </div>
              <div className="mt-1 text-xs text-slate-500">{r.type}</div>
            </div>
          ))}
          {!summaryQ.data?.todayReminders?.length && <div className="text-sm text-slate-500">No reminders set for today yet.</div>}
        </div>
      </Card>
    </div>
  );
}

