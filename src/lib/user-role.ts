import type { UserRole } from "./api-types";

/**
 * Samakan string role dari API dengan UserRole di app.
 * Backend sering mengirim `guru` / `teacher` untuk akun yang masuk dashboard trainer.
 */
export function normalizeUserRoleFromApi(role: string | undefined | null): UserRole {
  const r = String(role ?? "").toLowerCase().trim();
  if (r === "admin") return "admin";
  if (r === "trainer" || r === "guru" || r === "teacher" || r === "instructor") return "trainer";
  if (r === "student" || r === "siswa") return "student";
  return "student";
}

/** True jika akun ini pengajar (dashboard trainer), setelah normalisasi role API. */
export function isTrainerAccountRole(role: string | undefined | null): boolean {
  return normalizeUserRoleFromApi(role) === "trainer";
}
