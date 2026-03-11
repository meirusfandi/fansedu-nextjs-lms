"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { DashboardLayout, Sidebar } from "@/components/layout";
import { useAuth } from "@/hooks/useAuth";
import { logout } from "@/services/auth";
import { trainerSidebarSections } from "@/features/dashboard/sidebar-config";

export function TrainerDashboardLayout({ children }: { children: React.ReactNode }) {
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
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-300 border-t-sky-600" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <DashboardLayout
      sidebar={
        <Sidebar
          currentPath={pathname}
          sections={trainerSidebarSections}
          onLogout={handleLogout}
          title="Fansedu"
          subtitle="Trainer Dashboard"
          logoLetter="T"
          accent="sky"
        />
      }
      title="Trainer Dashboard"
      user={user}
      onLogout={handleLogout}
    >
      {children}
    </DashboardLayout>
  );
}
