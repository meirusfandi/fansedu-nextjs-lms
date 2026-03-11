"use client";

import { create } from "zustand";
import type { AuthUser, DashboardRole } from "@/types";
import type { User } from "@/lib/api-types";
import {
  setAuthToken as setCookieAuth,
  clearAuthToken as clearCookieAuth,
  getAuthRole,
  getAuthUserName,
} from "@/lib/api";

/** Read token from cookie (client-only). */
function readTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/auth_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function userToAuthUser(u: User): AuthUser {
  const role: DashboardRole = u.role === "trainer" ? "trainer" : u.role;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role,
    avatar_url: u.avatar_url,
  };
}

interface AuthStore {
  token: string | null;
  user: AuthUser | null;
  role: DashboardRole | null;
  isHydrated: boolean;
  setAuth: (params: {
    token: string;
    user: User;
    maxAgeSeconds?: number;
  }) => void;
  clearAuth: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  token: null,
  user: null,
  role: null,
  isHydrated: false,

  setAuth: ({ token, user, maxAgeSeconds = 604800 }) => {
    const roleForCookie = user.role;
    const name = user.name;
    setCookieAuth(token, maxAgeSeconds, roleForCookie, name);
    const authUser = userToAuthUser(user);
    set({
      token,
      user: authUser,
      role: authUser.role,
      isHydrated: true,
    });
  },

  clearAuth: () => {
    clearCookieAuth();
    set({ token: null, user: null, role: null, isHydrated: true });
  },

  hydrate: () => {
    if (typeof document === "undefined") return;
    const token = readTokenFromCookie();
    const roleFromCookie = getAuthRole();
    const name = getAuthUserName();
    if (!token || !roleFromCookie) {
      set({ token: null, user: null, role: null, isHydrated: true });
      return;
    }
    const role: DashboardRole = roleFromCookie;
    set({
      token,
      user: {
        id: "",
        name: name ?? "",
        email: "",
        role,
      },
      role,
      isHydrated: true,
    });
  },
}));

/** Map backend role (e.g. "guru") to DashboardRole. */
export function toDashboardRole(backendRole: string): DashboardRole {
  if (backendRole === "admin") return "admin";
  if (backendRole === "student") return "student";
  if (backendRole === "guru" || backendRole === "trainer") return "trainer";
  if (backendRole === "teacher") return "teacher";
  return "student";
}
