"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { DashboardRole } from "@/types";

const ROLE_DASHBOARD: Record<DashboardRole, string> = {
  admin: "/admin/dashboard",
  trainer: "/trainer/dashboard",
};

/** Hanya admin dan trainer (aplikasi ini tidak memakai dashboard siswa). */
export function getDashboardPathForRole(role: DashboardRole | null): string | null {
  if (!role) return null;
  return ROLE_DASHBOARD[role] ?? null;
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
      if (
        pathname !== "/login" &&
        pathname !== "/register" &&
        pathname !== "/forgot-password" &&
        pathname !== "/landing"
      ) {
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
