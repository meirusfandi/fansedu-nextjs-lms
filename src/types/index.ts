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

/** Role used for dashboard routing (backend may use "guru" → we use "trainer"). */
export type DashboardRole = "admin" | "student" | "teacher" | "trainer";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: DashboardRole;
  avatar_url?: string | null;
}

export interface AuthState {
  token: string | null;
  user: AuthUser | null;
  role: DashboardRole | null;
  isHydrated: boolean;
}
