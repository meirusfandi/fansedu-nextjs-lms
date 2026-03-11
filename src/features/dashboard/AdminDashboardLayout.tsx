"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { DashboardLayout, Sidebar } from "@/components/layout";
import { useAuth } from "@/hooks/useAuth";
import { logout } from "@/services/auth";
import { adminSidebarSections } from "@/features/dashboard/sidebar-config";

export function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const { user, isAuthenticated, isHydrated } = useAuth();

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      window.location.href = "/login";
    }
  }, [isHydrated, isAuthenticated]);

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <DashboardLayout
      sidebar={
        <Sidebar
          currentPath={pathname}
          sections={adminSidebarSections}
          onLogout={handleLogout}
          title="Fansedu"
          subtitle="Admin"
          logoLetter="A"
          accent="zinc"
        />
      }
      title="Admin Dashboard"
      user={user}
      onLogout={handleLogout}
    >
      {children}
    </DashboardLayout>
  );
}
