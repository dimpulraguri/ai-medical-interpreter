"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { todayISO } from "@/lib/date";

export default function TrackerPage() {
  const qc = useQueryClient();
  const waterQ = useQuery({
    queryKey: ["metrics", "water"],
    queryFn: async () => (await api.get("/metrics/water")).data.water as Array<{ date: string; glasses: number }>
  });
  const weightQ = useQuery({
    queryKey: ["metrics", "weight"],
    queryFn: async () => (await api.get("/metrics/weight")).data.weight as Array<{ date: string; weightKg: number }>
  });

  const today = todayISO();
  const todayWater = waterQ.data?.find((x) => x.date === today)?.glasses ?? 0;
  const lastWeight = weightQ.data?.slice(-1)[0]?.weightKg ?? null;

  const saveWaterM = useMutation({
    mutationFn: async (glasses: number) => api.post("/metrics/water", { date: today, glasses }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["metrics", "water"] })
  });
  const saveWeightM = useMutation({
    mutationFn: async (weightKg: number) => api.post("/metrics/weight", { date: today, weightKg }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["metrics", "weight"] })
  });

  const [heightCm, setHeightCm] = React.useState<number>(170);
  const [weightKg, setWeightKg] = React.useState<number>(lastWeight ?? 70);

  const bmi = heightCm > 0 ? weightKg / Math.pow(heightCm / 100, 2) : 0;
  const bmiLabel = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : bmi < 30 ? "Overweight" : "Obesity";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Trackers</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">Water intake, weight tracking, and BMI calculator.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Water intake (today)</div>
            <Badge variant="info">{today}</Badge>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={() => saveWaterM.mutate(Math.max(0, todayWater - 1))}>
              -1
            </Button>
            <div className="text-lg font-semibold">{todayWater} glasses</div>
            <Button onClick={() => saveWaterM.mutate(todayWater + 1)}>+1</Button>
          </div>
          <div className="mt-2 text-xs text-slate-500">Tip: Aim for a steady intake across the day.</div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Weight (today)</div>
            <Badge variant="info">{today}</Badge>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Input
              type="number"
              step="0.1"
              value={weightKg}
              onChange={(e) => setWeightKg(Number(e.target.value))}
              className="max-w-[160px]"
            />
            <Button onClick={() => saveWeightM.mutate(weightKg)} disabled={saveWeightM.isPending}>
              {saveWeightM.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
          <div className="mt-2 text-xs text-slate-500">Trend is available on the Overview chart.</div>
        </Card>
      </div>

      <Card>
        <div className="text-sm font-semibold">BMI calculator</div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3 sm:items-end">
          <div>
            <div className="mb-1 text-xs font-medium">Height (cm)</div>
            <Input type="number" value={heightCm} onChange={(e) => setHeightCm(Number(e.target.value))} />
          </div>
          <div>
            <div className="mb-1 text-xs font-medium">Weight (kg)</div>
            <Input type="number" value={weightKg} onChange={(e) => setWeightKg(Number(e.target.value))} />
          </div>
          <div>
            <div className="mb-1 text-xs font-medium">BMI</div>
            <div className="flex items-center gap-2">
              <div className="text-xl font-semibold">{Number.isFinite(bmi) ? bmi.toFixed(1) : "—"}</div>
              <Badge variant="info">{bmiLabel}</Badge>
            </div>
          </div>
        </div>
        <div className="mt-3 text-xs text-slate-500">BMI is a screening tool; consult a clinician for medical interpretation.</div>
      </Card>
    </div>
  );
}

