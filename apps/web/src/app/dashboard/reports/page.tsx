"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { getApiErrorMessage } from "@/lib/errors";

type Report = { id: string; filename: string; status: "uploaded" | "processing" | "ready" | "failed"; createdAt: string };

export default function ReportsPage() {
  const qc = useQueryClient();
  const listQ = useQuery({
    queryKey: ["reports"],
    queryFn: async () => (await api.get("/reports")).data.reports as Report[]
  });

  const uploadM = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      return (await api.post("/reports/upload", fd, { headers: { "Content-Type": "multipart/form-data" } })).data as {
        reportId: string;
      };
    },
    onSuccess: () => {
      setServerError(null);
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: (err) => setServerError(getApiErrorMessage(err))
  });

  const [file, setFile] = React.useState<File | null>(null);
  const [serverError, setServerError] = React.useState<string | null>(null);

  function statusBadge(status: Report["status"]) {
    if (status === "ready") return <Badge variant="ok">Ready</Badge>;
    if (status === "failed") return <Badge variant="danger">Failed</Badge>;
    if (status === "processing") return <Badge variant="warn">Processing</Badge>;
    return <Badge variant="info">Uploaded</Badge>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Medical reports</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">Upload a PDF or a clear photo (JPG/PNG).</p>
      </div>

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm font-semibold">Upload report</div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="file"
              accept="application/pdf,image/png,image/jpeg"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <Button disabled={!file || uploadM.isPending} onClick={() => file && uploadM.mutate(file)}>
              {uploadM.isPending ? "Uploading…" : "Analyze with AI"}
            </Button>
          </div>
        </div>
        {uploadM.isError && (
          <div className="mt-3 text-sm text-rose-600">
            Upload failed: {serverError ?? "Please try again."}
          </div>
        )}
        {uploadM.isSuccess && <div className="mt-3 text-sm text-emerald-600">Uploaded. Processing may take a minute.</div>}
      </Card>

      <Card>
        <div className="text-sm font-semibold">Your uploads</div>
        <div className="mt-3 space-y-2">
          {(listQ.data ?? []).map((r) => (
            <Link
              key={r.id}
              href={`/dashboard/reports/${r.id}`}
              className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-950"
            >
              <div className="min-w-0">
                <div className="truncate font-medium">{r.filename}</div>
                <div className="text-xs text-slate-500">{new Date(r.createdAt).toLocaleString()}</div>
              </div>
              {statusBadge(r.status)}
            </Link>
          ))}
          {!listQ.data?.length && <div className="text-sm text-slate-500">No reports uploaded yet.</div>}
        </div>
      </Card>
    </div>
  );
}
