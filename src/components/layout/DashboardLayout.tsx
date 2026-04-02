"use client";

import { useEffect, useState } from "react";
import { TopNavbar } from "./TopNavbar";

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
  const [sidebarHidden, setSidebarHidden] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("fansedu_sidebar_hidden");
    setSidebarHidden(saved === "1");
  }, []);

  const handleToggleSidebar = () => {
    setSidebarHidden((prev) => {
      const next = !prev;
      window.localStorage.setItem("fansedu_sidebar_hidden", next ? "1" : "0");
      return next;
    });
  };

  return (
    <div className="flex min-h-screen bg-zinc-50">
      {!sidebarHidden ? sidebar : null}
      <div className="flex flex-1 flex-col min-w-0">
        <TopNavbar
          title={title}
          user={user}
          onLogout={onLogout}
          sidebarHidden={sidebarHidden}
          onToggleSidebar={handleToggleSidebar}
        />
        <main className="flex-1 p-4 text-zinc-900 md:p-6 [color-scheme:light]">
          {children}
        </main>
      </div>
    </div>
  );
}
