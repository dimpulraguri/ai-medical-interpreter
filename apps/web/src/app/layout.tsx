import "./globals.css";
import type { Metadata } from "next";
import { QueryProvider } from "@/components/QueryProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { TopNav } from "@/components/TopNav";

export const metadata: Metadata = {
  title: "AI Medical Report Interpreter – Your 24/7 Virtual Doctor",
  description: "Upload lab reports, understand results in simple language, get safe next-step guidance, and reminders."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <AuthProvider>
            <TopNav />
            {children}
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

