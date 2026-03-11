/**
 * Auth service: login, register, logout.
 * Delegates to lib/api and syncs with store.
 */

import { login as apiLogin, register as apiRegister, logout as apiLogout } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import type { LoginRequest, RegisterRequest } from "@/lib/api-types";
import type { User } from "@/lib/api-types";

export async function login(credentials: LoginRequest, rememberMe = false) {
  const res = await apiLogin(credentials);
  const maxAge = rememberMe ? 2592000 : 604800;
  const user = res.user as User & { nama?: string; full_name?: string; role?: string };
  const name = (user.name ?? user.nama ?? user.full_name ?? "").trim() || user.email;
  const role = (user.role === "guru" ? "trainer" : user.role) as User["role"];
  const normalizedUser: User = { ...user, name, role };
  useAuthStore.getState().setAuth({
    token: res.token,
    user: normalizedUser,
    maxAgeSeconds: maxAge,
  });
  return res;
}

export async function register(data: RegisterRequest) {
  const res = await apiRegister(data);
  const user = res.user as User & { nama?: string; full_name?: string; role?: string };
  const name = (user.name ?? user.nama ?? user.full_name ?? "").trim() || user.email;
  const role = (user.role === "guru" ? "trainer" : user.role) as User["role"];
  const normalizedUser: User = { ...user, name, role };
  useAuthStore.getState().setAuth({
    token: res.token,
    user: normalizedUser,
    maxAgeSeconds: 604800,
  });
  return res;
}

export function logout() {
  apiLogout();
  useAuthStore.getState().clearAuth();
}
