/**
 * Central type re-exports and dashboard-specific types.
 * API types live in lib/api-types.ts.
 */

export type {
  User,
  UserRole,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from "@/lib/api-types";

/** Role untuk routing LMS FansEdu — SuperAdmin/Admin, Siswa, dan Orang Tua (Guru/Trainer di TeachSync). */
export type DashboardRole = "admin" | "super_admin" | "student" | "parent";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: DashboardRole;
  avatarUrl?: string | null;
}

export interface AuthState {
  token: string | null;
  user: AuthUser | null;
  role: DashboardRole | null;
  isHydrated: boolean;
}
