"use client";

import { TopNavbar } from "./TopNavbar";
import type { SidebarProps } from "./Sidebar";

export interface DashboardLayoutProps {
  sidebar: React.ReactElement;
  children: React.ReactNode;
  title?: string;
  user?: { name: string; email?: string } | null;
  onLogout?: () => void;
}

export function DashboardLayout({
  sidebar,
  children,
  title = "Dashboard",
  user,
  onLogout,
}: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-zinc-50">
      {sidebar}
      <div className="flex flex-1 flex-col min-w-0">
        <TopNavbar title={title} user={user} onLogout={onLogout} />
        <main className="flex-1 p-4 text-zinc-900 md:p-6 [color-scheme:light]">
          {children}
        </main>
      </div>
    </div>
  );
}
