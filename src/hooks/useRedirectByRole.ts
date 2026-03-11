"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { DashboardRole } from "@/types";

const ROLE_DASHBOARD: Record<DashboardRole, string> = {
  admin: "/admin/dashboard",
  student: "/landing",
  teacher: "/landing",
  trainer: "/trainer/dashboard",
};

/** Hanya admin dan trainer yang punya dashboard di app ini. Siswa/guru → landing. */
export function getDashboardPathForRole(role: DashboardRole | null): string | null {
  if (!role) return null;
  return ROLE_DASHBOARD[role] ?? "/landing";
}

/**
 * Redirects to role dashboard when authenticated.
 * Use in root page or after login.
 */
export function useRedirectByRole() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, role, isHydrated } = useAuth();

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) {
      if (pathname !== "/login" && pathname !== "/register" && pathname !== "/forgot-password") {
        router.replace("/login");
      }
      return;
    }
    const dest = getDashboardPathForRole(role);
    if (dest && pathname === "/") {
      router.replace(dest);
    }
  }, [isHydrated, isAuthenticated, role, pathname, router]);

  return { isAuthenticated, role, isHydrated };
}
