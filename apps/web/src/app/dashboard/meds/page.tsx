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
import { todayISO } from "@/lib/date";

type Schedule = {
  id: string;
  name: string;
  dosage: string;
  times: string[];
  startDate: string;
  durationDays: number;
  enabled: boolean;
};

const Schema = z.object({
  name: z.string().min(2),
  dosage: z.string().min(1),
  times: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  durationDays: z.coerce.number().int().min(1).max(365)
});
type Form = z.infer<typeof Schema>;

export default function MedicinesPage() {
  const qc = useQueryClient();
  const listQ = useQuery({
    queryKey: ["meds", "schedules"],
    queryFn: async () => (await api.get("/meds/schedules")).data.schedules as Schedule[]
  });
  const adherenceQ = useQuery({
    queryKey: ["meds", "adherence"],
    queryFn: async () =>
      (await api.get("/meds/adherence?days=14")).data as { adherencePct: number | null; taken: number; planned: number }
  });

  const createM = useMutation({
    mutationFn: async (body: any) => api.post("/meds/schedules", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meds", "schedules"] })
  });
  const toggleM = useMutation({
    mutationFn: async (s: Schedule) => api.patch(`/meds/schedules/${s.id}`, { enabled: !s.enabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meds", "schedules"] })
  });
  const delM = useMutation({
    mutationFn: async (id: string) => api.delete(`/meds/schedules/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meds", "schedules"] })
  });
  const logM = useMutation({
    mutationFn: async (body: { scheduleId: string; status: "taken" | "skipped"; plannedAt: string }) =>
      api.post("/meds/logs", { scheduleId: body.scheduleId, status: body.status, plannedAt: body.plannedAt }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meds", "adherence"] })
  });

  const { register, handleSubmit, reset, formState } = useForm<Form>({
    resolver: zodResolver(Schema),
    defaultValues: { name: "", dosage: "", times: "09:00", startDate: todayISO(), durationDays: 7 }
  });

  async function onSubmit(values: Form) {
    const times = values.times
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    await createM.mutateAsync({ ...values, times, enabled: true });
    reset({ name: "", dosage: "", times: "09:00", startDate: todayISO(), durationDays: 7 });
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Tablet / Medicine Scheduler</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Add your medicines and mark them taken/skipped to track adherence.
        </p>
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Adherence (last 14 days)</div>
          <Badge variant="info">
            {adherenceQ.data?.adherencePct != null
              ? `${adherenceQ.data.adherencePct}% (${adherenceQ.data.taken}/${adherenceQ.data.planned})`
              : "—"}
          </Badge>
        </div>
        {adherenceQ.data && adherenceQ.data.planned > 0 && adherenceQ.data.taken > adherenceQ.data.planned ? (
          <div className="mt-2 text-xs text-rose-600">
            Warning: logged taken doses exceed scheduled doses. This usually means duplicate taps.
          </div>
        ) : null}
      </Card>

      <Card>
        <div className="text-sm font-semibold">Add schedule</div>
        <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <div className="mb-1 text-xs font-medium">Medicine name</div>
            <Input placeholder="Metformin" {...register("name")} />
          </div>
          <div>
            <div className="mb-1 text-xs font-medium">Dosage</div>
            <Input placeholder="500mg" {...register("dosage")} />
          </div>
          <div>
            <div className="mb-1 text-xs font-medium">Times (comma-separated)</div>
            <Input placeholder="09:00,21:00" {...register("times")} />
          </div>
          <div>
            <div className="mb-1 text-xs font-medium">Start date</div>
            <Input type="date" {...register("startDate")} />
          </div>
          <div>
            <div className="mb-1 text-xs font-medium">Duration (days)</div>
            <Input type="number" min={1} max={365} {...register("durationDays")} />
          </div>
          <div className="md:col-span-2">
            <Button disabled={formState.isSubmitting || createM.isPending} type="submit">
              {createM.isPending ? "Saving…" : "Save schedule"}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <div className="text-sm font-semibold">Your schedules</div>
        <div className="mt-3 space-y-2">
          {(listQ.data ?? []).map((s) => (
            <div
              key={s.id}
              className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3 text-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-800"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="truncate font-medium">
                    {s.name} <span className="text-slate-500">({s.dosage})</span>
                  </div>
                  {!s.enabled && <Badge variant="warn">Paused</Badge>}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {s.times.join(", ")} • {s.startDate} • {s.durationDays} days
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {s.times.map((t) => {
                  const plannedAt = `${todayISO()}T${t}:00`;
                  return (
                    <div key={t} className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 dark:border-slate-800">
                      <span className="text-xs text-slate-500">{t}</span>
                      <Button variant="secondary" onClick={() => logM.mutate({ scheduleId: s.id, status: "taken", plannedAt })}>
                        Taken
                      </Button>
                      <Button variant="ghost" onClick={() => logM.mutate({ scheduleId: s.id, status: "skipped", plannedAt })}>
                        Skipped
                      </Button>
                    </div>
                  );
                })}
                <Button variant="secondary" onClick={() => toggleM.mutate(s)}>
                  {s.enabled ? "Pause" : "Enable"}
                </Button>
                <Button variant="ghost" onClick={() => delM.mutate(s.id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
          {!listQ.data?.length && <div className="text-sm text-slate-500">No medicine schedules yet.</div>}
        </div>
        {adherenceQ.data && adherenceQ.data.planned > 0 && adherenceQ.data.taken > adherenceQ.data.planned ? (
          <div className="mt-2 text-xs text-rose-600">
            Warning: logged taken doses exceed scheduled doses. This usually means duplicate taps.
          </div>
        ) : null}
      </Card>
    </div>
  );
}

