"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AdminOnly } from "@/components/AdminOnly";

type AdminUser = { id: string; email: string; name: string; role: "user" | "admin"; createdAt: string };
type AdminReport = { id: string; userId: string; filename: string; status: string; createdAt: string };
type AdminAudit = {
  id: string;
  userId: string | null;
  event: string;
  method: string;
  path: string;
  status: number;
  createdAt: string;
};
type AdminMetrics = {
  totals: { users: number; reports: number };
  signups: { last24h: number; last7d: number };
  logins: { last24h: number; last7d: number };
};

export default function AdminPage() {
  const usersQ = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => (await api.get("/admin/users")).data.users as AdminUser[]
  });
  const reportsQ = useQuery({
    queryKey: ["admin", "reports"],
    queryFn: async () => (await api.get("/admin/reports")).data.reports as AdminReport[]
  });
  const auditQ = useQuery({
    queryKey: ["admin", "audit"],
    queryFn: async () => (await api.get("/admin/audit?limit=200")).data.audit as AdminAudit[]
  });
  const metricsQ = useQuery({
    queryKey: ["admin", "metrics"],
    queryFn: async () => (await api.get("/admin/metrics")).data as AdminMetrics
  });

  return (
    <AdminOnly>
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold">Admin</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">User list and recent uploads (metadata only).</p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <div className="text-xs text-slate-500">Total users</div>
            <div className="mt-2 text-2xl font-semibold">{metricsQ.data?.totals.users ?? "—"}</div>
          </Card>
          <Card>
            <div className="text-xs text-slate-500">Total reports</div>
            <div className="mt-2 text-2xl font-semibold">{metricsQ.data?.totals.reports ?? "—"}</div>
          </Card>
          <Card>
            <div className="text-xs text-slate-500">Logins (24h / 7d)</div>
            <div className="mt-2 text-2xl font-semibold">
              {metricsQ.data ? `${metricsQ.data.logins.last24h} / ${metricsQ.data.logins.last7d}` : "—"}
            </div>
          </Card>
          <Card>
            <div className="text-xs text-slate-500">Signups (24h / 7d)</div>
            <div className="mt-2 text-2xl font-semibold">
              {metricsQ.data ? `${metricsQ.data.signups.last24h} / ${metricsQ.data.signups.last7d}` : "—"}
            </div>
          </Card>
        </div>

        <Card>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Users</div>
            <Badge variant="info">{usersQ.data?.length ?? "—"}</Badge>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs text-slate-500">
                <tr>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {(usersQ.data ?? []).map((u) => (
                  <tr key={u.id} className="border-t border-slate-200 dark:border-slate-800">
                    <td className="py-2 pr-4">{u.email}</td>
                    <td className="py-2 pr-4">{u.name}</td>
                    <td className="py-2 pr-4">
                      <Badge variant={u.role === "admin" ? "warn" : "info"}>{u.role}</Badge>
                    </td>
                    <td className="py-2 text-slate-600 dark:text-slate-300">{new Date(u.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Recent reports</div>
            <Badge variant="info">{reportsQ.data?.length ?? "—"}</Badge>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs text-slate-500">
                <tr>
                  <th className="py-2 pr-4">Filename</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">UserId</th>
                  <th className="py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {(reportsQ.data ?? []).map((r) => (
                  <tr key={r.id} className="border-t border-slate-200 dark:border-slate-800">
                    <td className="py-2 pr-4">{r.filename}</td>
                    <td className="py-2 pr-4">
                      <Badge variant={r.status === "ready" ? "ok" : r.status === "failed" ? "danger" : "info"}>{r.status}</Badge>
                    </td>
                    <td className="py-2 pr-4 font-mono text-xs">{r.userId}</td>
                    <td className="py-2 text-slate-600 dark:text-slate-300">{new Date(r.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Audit log</div>
            <Badge variant="info">{auditQ.data?.length ?? "â€”"}</Badge>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs text-slate-500">
                <tr>
                  <th className="py-2 pr-4">Event</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Method</th>
                  <th className="py-2 pr-4">Path</th>
                  <th className="py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {(auditQ.data ?? []).slice(0, 200).map((a) => (
                  <tr key={a.id} className="border-t border-slate-200 dark:border-slate-800">
                    <td className="py-2 pr-4 font-mono text-xs">{a.event}</td>
                    <td className="py-2 pr-4">
                      <Badge variant={a.status >= 500 ? "danger" : a.status >= 400 ? "warn" : "ok"}>{a.status}</Badge>
                    </td>
                    <td className="py-2 pr-4 font-mono text-xs">{a.method}</td>
                    <td className="py-2 pr-4 font-mono text-xs">{a.path}</td>
                    <td className="py-2 text-slate-600 dark:text-slate-300">{new Date(a.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminOnly>
  );
}
