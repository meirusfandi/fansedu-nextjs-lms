"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth";
import type { DashboardRole } from "@/types";

export function useAuth() {
  const { token, user, role, isHydrated, hydrate, clearAuth } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const isAuthenticated = Boolean(isHydrated && token);
  const isRole = (r: DashboardRole) => role === r;

  return {
    token,
    user,
    role,
    isHydrated,
    isAuthenticated,
    isRole,
    logout: clearAuth,
  };
}
