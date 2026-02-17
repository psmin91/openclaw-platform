import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "OpenClaw Platform",
  description: "Multi-tenant OpenClaw Management Dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex">
        <Sidebar />
        <main className="flex-1 p-6 overflow-auto min-h-screen">{children}</main>
      </body>
    </html>
  );
}
