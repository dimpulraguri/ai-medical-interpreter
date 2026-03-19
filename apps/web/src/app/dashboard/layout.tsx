import { RequireAuth } from "@/components/RequireAuth";
import { DashboardShell } from "@/components/DashboardShell";
import { ChatWidget } from "@/components/chat/ChatWidget";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <DashboardShell>
        {children}
        <ChatWidget />
      </DashboardShell>
    </RequireAuth>
  );
}

