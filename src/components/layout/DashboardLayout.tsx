"use client";

import { useState } from "react";
import { TopNavbar, type TopNavbarMobileNav } from "./TopNavbar";

export interface DashboardLayoutProps {
  sidebar: React.ReactElement;
  children: React.ReactNode;
  title?: string;
  user?: { name: string; email?: string } | null;
  onLogout?: () => void;
  /** Navigasi layar kecil — isi sama dengan sidebar. */
  mobileNav?: TopNavbarMobileNav;
}

export function DashboardLayout({
  sidebar,
  children,
  title = "Dashboard",
  user,
  onLogout,
  mobileNav,
}: DashboardLayoutProps) {
  const [sidebarHidden, setSidebarHidden] = useState(false);

  const handleToggleSidebar = () => {
    setSidebarHidden((prev) => !prev);
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
          mobileNav={mobileNav}
        />
        <main className="flex-1 p-4 text-zinc-900 md:p-6 [color-scheme:light]">
          {children}
        </main>
      </div>
    </div>
  );
}
