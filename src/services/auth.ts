/**
 * Auth service: login, register, logout.
 * LMS FansEdu: Khusus untuk SuperAdmin, Siswa, dan Orang Tua.
 * Akun Guru/Pengajar diarahkan ke portal TeachSync.
 */

import { login as apiLogin, register as apiRegister, logout as apiLogout } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, User } from "@/lib/api-types";

/** Normalisasi role dari API ke User["role"]. Menolak guru/trainer di LMS (guru diarahkan ke TeachSync). */
function normalizeRoleFromApi(raw: string | undefined): User["role"] {
  const r = (raw ?? "").toLowerCase().trim();
  if (r === "guru" || r === "trainer" || r === "teacher") {
    throw new Error(
      "Akun Anda terdaftar sebagai Guru/Pengajar. Silakan masuk melalui portal TeachSync Guru."
    );
  }
  if (r === "super_admin" || r === "superadmin") return "super_admin";
  if (r === "admin") return "admin";
  if (r === "student" || r === "siswa") return "student";
  if (r === "parent" || r === "ortu" || r === "orang_tua" || r === "wali") return "parent";
  
  // Default fallback jika role belum diset spesifik (biasanya student)
  return "student";
}

export async function login(credentials: LoginRequest, rememberMe = false): Promise<LoginResponse> {
  const res = await apiLogin(credentials);
  const maxAge = rememberMe ? 2592000 : 604800;
  const user = res.user as User & { role?: string; displayName?: string };
  const name = (user.name ?? user.displayName ?? "").trim() || user.email;
  const role = normalizeRoleFromApi(user.role);
  const normalizedUser: User = { ...user, name, role };
  useAuthStore.getState().setAuth({
    token: res.token,
    user: normalizedUser,
    maxAgeSeconds: maxAge,
  });
  return res;
}

/** Pendaftaran self-service di LMS: untuk Siswa atau Orang Tua. */
export async function register(data: RegisterRequest & { role?: "student" | "parent" }): Promise<RegisterResponse> {
  const res = await apiRegister(data as RegisterRequest);
  const user = res.user as User & { role?: string; displayName?: string };
  const name = (user.name ?? user.displayName ?? "").trim() || user.email;
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
