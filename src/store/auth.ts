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
  const role = toDashboardRole(u.role);
  if (!role) {
    throw new Error("Aplikasi ini hanya mendukung akun Admin, Siswa, atau Orang Tua. Akun Guru menggunakan TeachSync.");
  }
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role,
    avatarUrl: u.avatarUrl,
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
    } catch (err) {
      clearCookieAuth();
      set({ token: null, user: null, role: null, isHydrated: true });
      throw err;
    }
    const roleForCookie = authUser.role;
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
    const role = toDashboardRole(roleFromCookie);
    if (!role) {
      clearCookieAuth();
      set({ token: null, user: null, role: null, isHydrated: true });
      return;
    }
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

/** Map string role backend ke DashboardRole (admin | super_admin | student | parent). */
export function toDashboardRole(backendRole: string): DashboardRole | null {
  const r = (backendRole || "").toLowerCase().trim();
  if (r === "super_admin" || r === "superadmin") return "super_admin";
  if (r === "admin") return "admin";
  if (r === "student" || r === "siswa") return "student";
  if (r === "parent" || r === "ortu" || r === "orang_tua" || r === "wali") return "parent";
  return null;
}
