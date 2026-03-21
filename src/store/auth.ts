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
  if (u.role !== "admin" && u.role !== "trainer") {
    throw new Error("Aplikasi ini hanya mendukung akun Admin atau Trainer.");
  }
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
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
    let authUser: AuthUser;
    try {
      authUser = userToAuthUser(user);
    } catch {
      clearCookieAuth();
      set({ token: null, user: null, role: null, isHydrated: true });
      throw new Error("Aplikasi ini hanya untuk Admin dan Trainer.");
    }
    const roleForCookie = user.role;
    const name = user.name;
    setCookieAuth(token, maxAgeSeconds, roleForCookie, name);
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
    if (roleFromCookie !== "admin" && roleFromCookie !== "trainer") {
      clearCookieAuth();
      set({ token: null, user: null, role: null, isHydrated: true });
      return;
    }
    const role = roleFromCookie;
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

/** Map string role backend ke DashboardRole (hanya admin | trainer dipakai di app). */
export function toDashboardRole(backendRole: string): DashboardRole | null {
  if (backendRole === "admin") return "admin";
  if (backendRole === "guru" || backendRole === "trainer" || backendRole === "teacher") return "trainer";
  return null;
}
