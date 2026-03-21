/**
 * Auth service: login, register, logout.
 * Delegates to lib/api and syncs with store.
 * Aplikasi web ini hanya untuk Admin & Trainer (bukan siswa).
 */

import { login as apiLogin, register as apiRegister, logout as apiLogout } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import type { LoginRequest, RegisterRequest } from "@/lib/api-types";
import type { User } from "@/lib/api-types";

/** Normalisasi role dari API ke User["role"]. Menolak siswa untuk login/register di app ini. */
function normalizeRoleFromApi(raw: string | undefined): User["role"] {
  if (raw === "guru") return "trainer";
  if (raw === "admin" || raw === "trainer") return raw;
  if (raw === "student") {
    throw new Error(
      "Aplikasi ini hanya untuk Admin dan Trainer. Akun siswa tidak dapat masuk melalui halaman ini."
    );
  }
  throw new Error("Peran akun tidak didukung di aplikasi ini.");
}

export async function login(credentials: LoginRequest, rememberMe = false) {
  const res = await apiLogin(credentials);
  const maxAge = rememberMe ? 2592000 : 604800;
  const user = res.user as User & { nama?: string; full_name?: string; role?: string };
  const name = (user.name ?? user.nama ?? user.full_name ?? "").trim() || user.email;
  const role = normalizeRoleFromApi(user.role);
  const normalizedUser: User = { ...user, name, role };
  useAuthStore.getState().setAuth({
    token: res.token,
    user: normalizedUser,
    maxAgeSeconds: maxAge,
  });
  return res;
}

/** Pendaftaran self-service: hanya Trainer (backend memakai alias `guru` jika perlu). */
export async function register(data: RegisterRequest) {
  const res = await apiRegister(data);
  const user = res.user as User & { nama?: string; full_name?: string; role?: string };
  const name = (user.name ?? user.nama ?? user.full_name ?? "").trim() || user.email;
  const role = normalizeRoleFromApi(user.role);
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
