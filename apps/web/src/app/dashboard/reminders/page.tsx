"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

type Reminder = {
  id: string;
  type: "water" | "medicine" | "diet" | "exercise" | "disease" | "custom";
  title: string;
  message?: string;
  frequency: "daily" | "weekly" | "monthly";
  times: string[];
  enabled: boolean;
};

const Schema = z.object({
  type: z.enum(["water", "medicine", "diet", "exercise", "disease", "custom"]),
  title: z.string().min(2),
  message: z.string().optional(),
  frequency: z.enum(["daily", "weekly", "monthly"]),
  times: z.string().min(1)
});
type Form = z.infer<typeof Schema>;

export default function RemindersPage() {
  const qc = useQueryClient();
  const listQ = useQuery({
    queryKey: ["reminders"],
    queryFn: async () => (await api.get("/reminders")).data.reminders as Reminder[]
  });

  const createM = useMutation({
    mutationFn: async (body: any) => (await api.post("/reminders", body)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reminders"] });
      reset({ type: "water", title: "Drink water", message: "Time to hydrate", frequency: "daily", times: "09:00,14:00,19:00" });
    }
  });

  const toggleM = useMutation({
    mutationFn: async (r: Reminder) => api.patch(`/reminders/${r.id}`, { enabled: !r.enabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reminders"] })
  });

  const delM = useMutation({
    mutationFn: async (id: string) => api.delete(`/reminders/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reminders"] })
  });

  const { register, handleSubmit, reset, formState } = useForm<Form>({
    resolver: zodResolver(Schema),
    defaultValues: { type: "water", title: "Drink water", message: "Time to hydrate", frequency: "daily", times: "09:00,14:00,19:00" }
  });

  async function onSubmit(values: Form) {
    const times = values.times
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    await createM.mutateAsync({ ...values, times, enabled: true });
  }

  function typeBadge(t: Reminder["type"]) {
    if (t === "water") return <Badge variant="info">Water</Badge>;
    if (t === "medicine") return <Badge variant="warn">Medicine</Badge>;
    return <Badge variant="info">{t}</Badge>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Reminders</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">Water, diet, exercise, and custom reminders.</p>
      </div>

      <Card>
        <div className="text-sm font-semibold">Create reminder</div>
        <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <div className="mb-1 text-xs font-medium">Type</div>
            <select className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950" {...register("type")}>
              <option value="water">Water</option>
              <option value="medicine">Medicine</option>
              <option value="diet">Diet</option>
              <option value="exercise">Exercise</option>
              <option value="disease">Disease-based</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div>
            <div className="mb-1 text-xs font-medium">Frequency</div>
            <select className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950" {...register("frequency")}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div>
            <div className="mb-1 text-xs font-medium">Title</div>
            <Input placeholder="Reminder title" {...register("title")} />
          </div>
          <div>
            <div className="mb-1 text-xs font-medium">Times (comma-separated)</div>
            <Input placeholder="09:00,14:00,19:00" {...register("times")} />
          </div>
          <div className="md:col-span-2">
            <div className="mb-1 text-xs font-medium">Message</div>
            <Input placeholder="Optional message" {...register("message")} />
          </div>
          <div className="md:col-span-2">
            <Button disabled={formState.isSubmitting || createM.isPending} type="submit">
              {createM.isPending ? "Saving…" : "Save reminder"}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <div className="text-sm font-semibold">Your reminders</div>
        <div className="mt-3 space-y-2">
          {(listQ.data ?? []).map((r) => (
            <div
              key={r.id}
              className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3 text-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-800"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="truncate font-medium">{r.title}</div>
                  {typeBadge(r.type)}
                  {!r.enabled && <Badge variant="warn">Paused</Badge>}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {r.frequency} • {r.times.join(", ")}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => toggleM.mutate(r)} disabled={toggleM.isPending}>
                  {r.enabled ? "Pause" : "Enable"}
                </Button>
                <Button variant="ghost" onClick={() => delM.mutate(r.id)} disabled={delM.isPending}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
          {!listQ.data?.length && <div className="text-sm text-slate-500">No reminders yet.</div>}
        </div>
      </Card>
    </div>
  );
}
