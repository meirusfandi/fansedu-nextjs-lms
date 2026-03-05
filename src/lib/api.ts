/**
 * API client for FansEdu LMS v1 (Go backend).
 * Set NEXT_PUBLIC_API_URL in .env (e.g. http://localhost:8080).
 */

import type {
  AdminCreateCourseRequest,
  AdminCreateLevelRequest,
  AdminCreateQuestionRequest,
  AdminCreateSubjectRequest,
  AdminCreateTryoutRequest,
  AdminCreateUserRequest,
  AdminIssueCertificateRequest,
  AdminOverviewResponse,
  AdminUpdateLevelRequest,
  AdminUpdateUserRequest,
  Attempt,
  AttemptReviewItem,
  AttemptReviewResponse,
  Certificate,
  Course,
  CourseEnrollment,
  DashboardResponse,
  ForgotPasswordRequest,
  LeaderboardEntry,
  Level,
  LoginRequest,
  LoginResponse,
  PutAnswerRequest,
  Question,
  RegisterRequest,
  RegisterResponse,
  ResetPasswordRequest,
  Role,
  Sekolah,
  StudentDashboardResponse,
  Subject,
  SubmitAttemptResponse,
  StartTryoutResponse,
  TryoutSession,
  User,
} from "./api-types";

/**
 * Mengubah error dari API/jaringan menjadi pesan yang ramah pengguna.
 * Gunakan saat menampilkan error ke pengguna (dashboard, login, dll).
 */
export function getFriendlyApiErrorMessage(err: unknown): string {
  const e = err as Error & { status?: number };
  const msg = (e?.message ?? "").toLowerCase();
  const status = e?.status;

  if (status === 500 || msg.includes("internal server error")) {
    return "Layanan sedang mengalami gangguan. Silakan coba lagi dalam beberapa saat.";
  }
  if (status === 502 || status === 503) {
    return "Layanan sementara tidak tersedia. Silakan coba lagi nanti.";
  }
  if (
    status == null &&
    (msg.includes("failed to fetch") ||
      msg.includes("network") ||
      msg.includes("load failed") ||
      msg.includes("connection"))
  ) {
    return "Tidak dapat terhubung ke server. Periksa koneksi internet Anda dan coba lagi.";
  }
  if (e?.message && e.message.trim()) {
    return e.message.trim();
  }
  return "Terjadi kesalahan. Silakan coba lagi.";
}

/** Di browser: same-origin /api/v1 (proxy). Di server: backend URL + /api/v1. */
function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin + "/api/v1";
  }
  const url =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.BASE_URL ||
    "http://localhost:8080";
  return url.replace(/\/$/, "") + "/api/v1";
}

const BASE = typeof window !== "undefined" ? getBaseUrl() : getBaseUrl();

function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/auth_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

const AUTH_NAME_KEY = "auth_user_name";

export function setAuthToken(
  token: string,
  maxAgeSeconds = 604800,
  role?: "admin" | "student",
  name?: string
): void {
  if (typeof document === "undefined") return;
  document.cookie = `auth_token=${encodeURIComponent(token)}; path=/; max-age=${maxAgeSeconds}; SameSite=Strict`;
  if (role) {
    document.cookie = `auth_role=${role}; path=/; max-age=${maxAgeSeconds}; SameSite=Strict`;
  }
  if (name != null) {
    document.cookie = `${AUTH_NAME_KEY}=${encodeURIComponent(name)}; path=/; max-age=${maxAgeSeconds}; SameSite=Strict`;
  }
}

export function getAuthUserName(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`${AUTH_NAME_KEY}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function clearAuthToken(): void {
  if (typeof document === "undefined") return;
  document.cookie = "auth_token=; path=/; max-age=0";
  document.cookie = "auth_role=; path=/; max-age=0";
  document.cookie = `${AUTH_NAME_KEY}=; path=/; max-age=0`;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
  overrides?: { baseUrl?: string }
): Promise<T> {
  const { method = "GET", body, auth = true } = options;
  const base = overrides?.baseUrl ?? BASE;
  const url = `${base}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const verb = method.toUpperCase();
  const hasBody = verb !== "GET" && verb !== "HEAD" && body != null;
  let res: Response;
  try {
    res = await fetch(url, {
      method: verb,
      headers,
      body: hasBody ? JSON.stringify(body) : undefined,
    });
  } catch (fetchErr) {
    const msg = (fetchErr as Error)?.message?.toLowerCase() ?? "";
    if (
      msg.includes("failed to fetch") ||
      msg.includes("network") ||
      msg.includes("load failed") ||
      msg.includes("connection")
    ) {
      throw new Error(
        "Tidak dapat terhubung ke server. Periksa koneksi internet Anda dan coba lagi."
      );
    }
    throw fetchErr;
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const d = data as { error?: string; message?: string };
    let message = d?.error ?? d?.message ?? res.statusText;
    if (res.status === 500 || message.toLowerCase().includes("internal server error")) {
      message = "Layanan sedang mengalami gangguan. Silakan coba lagi dalam beberapa saat.";
    } else if (res.status === 502 || res.status === 503) {
      message = "Layanan sementara tidak tersedia. Silakan coba lagi nanti.";
    }
    const err = new Error(message);
    (err as Error & { status: number }).status = res.status;
    throw err;
  }
  return data as T;
}

/** Untuk GET list: 404 atau 405 dianggap sebagai daftar kosong, tidak throw. */
function isNotFoundOrMethodNotAllowed(e: unknown): boolean {
  const status = (e as { status?: number })?.status;
  return status === 404 || status === 405;
}

// --- Health ---
export async function healthCheck(): Promise<{ status: string; time: string }> {
  return request("/health", { method: "GET", auth: false });
}

// --- Auth ---
/** Login via same-origin proxy so browser sends POST only (no CORS OPTIONS). */
export async function login(body: LoginRequest): Promise<LoginResponse> {
  const base =
    typeof window !== "undefined" ? window.location.origin : "";
  return request("/api/auth/login", { method: "POST", body, auth: false }, { baseUrl: base });
}

export async function register(body: RegisterRequest): Promise<RegisterResponse> {
  return request("/auth/register", { method: "POST", body, auth: false });
}

export async function logout(): Promise<{ ok: boolean }> {
  return request("/auth/logout", { method: "POST" });
}

export async function forgotPassword(
  body: ForgotPasswordRequest
): Promise<{ ok: boolean }> {
  return request("/auth/forgot-password", {
    method: "POST",
    body,
    auth: false,
  });
}

export async function resetPassword(
  body: ResetPasswordRequest
): Promise<{ ok: boolean }> {
  return request("/auth/reset-password", {
    method: "POST",
    body,
    auth: false,
  });
}

// --- Tryouts ---
/** Daftar tryout yang buka. GET api/v1/tryouts/open. 404 = daftar kosong. */
export async function listOpenTryouts(): Promise<TryoutSession[]> {
  try {
    const raw = await request<TryoutSession[] | { tryouts?: TryoutSession[]; data?: TryoutSession[] }>("/tryouts/open", { method: "GET", auth: false });
    if (Array.isArray(raw)) return raw;
    if (raw?.tryouts && Array.isArray(raw.tryouts)) return raw.tryouts;
    if (raw?.data && Array.isArray(raw.data)) return raw.data;
    return [];
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return [];
    throw e;
  }
}

/** Semua tryout (untuk siswa: tampil semua, pisah sudah selesai / akan datang). 404 = daftar kosong. */
export async function listAllTryouts(): Promise<TryoutSession[]> {
  try {
    const raw = await request<TryoutSession[] | { tryouts?: TryoutSession[]; data?: TryoutSession[] }>("/tryouts", { method: "GET", auth: false });
    if (Array.isArray(raw)) return raw;
    if (raw?.tryouts && Array.isArray(raw.tryouts)) return raw.tryouts;
    if (raw?.data && Array.isArray(raw.data)) return raw.data;
    return [];
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return [];
    throw e;
  }
}

export async function getTryout(tryoutId: string): Promise<TryoutSession> {
  return request(`/tryouts/${tryoutId}`, { method: "GET", auth: false });
}

/** Leaderboard per tryout. GET /tryouts/:tryoutId/leaderboard. 404/405 = []. */
export async function getTryoutLeaderboard(tryoutId: string): Promise<LeaderboardEntry[]> {
  try {
    const raw = await request<LeaderboardEntry[] | { leaderboard?: LeaderboardEntry[]; data?: LeaderboardEntry[] }>(
      `/tryouts/${tryoutId}/leaderboard`,
      { method: "GET", auth: false }
    );
    const list = Array.isArray(raw) ? raw : (raw as { leaderboard?: LeaderboardEntry[] })?.leaderboard ?? (raw as { data?: LeaderboardEntry[] })?.data ?? [];
    return normalizeLeaderboard(list);
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return [];
    throw e;
  }
}

export async function startTryout(
  tryoutId: string
): Promise<StartTryoutResponse> {
  return request(`/tryouts/${tryoutId}/start`, { method: "POST" });
}

// --- Attempts ---
/** Soal untuk attempt. 404 = daftar kosong. */
export async function getAttemptQuestions(
  attemptId: string
): Promise<Question[]> {
  try {
    const raw = await request<Question[] | { questions?: Question[]; data?: Question[] }>(`/attempts/${attemptId}/questions`, { method: "GET" });
    if (Array.isArray(raw)) return raw;
    if (raw?.questions && Array.isArray(raw.questions)) return raw.questions;
    if (raw?.data && Array.isArray(raw.data)) return raw.data;
    return [];
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return [];
    throw e;
  }
}

export async function putAttemptAnswer(
  attemptId: string,
  questionId: string,
  body: PutAnswerRequest
): Promise<Record<string, never>> {
  return request(
    `/attempts/${attemptId}/answers/${questionId}`,
    { method: "PUT", body }
  );
}

export async function submitAttempt(
  attemptId: string
): Promise<SubmitAttemptResponse> {
  return request(`/attempts/${attemptId}/submit`, { method: "POST" });
}

// --- Dashboard umum (GET /dashboard) ---
/** GET /api/v1/dashboard. Dipakai untuk leaderboard di dashboard siswa. 404/405 = return { leaderboard: [] }. */
export async function getDashboard(): Promise<DashboardResponse> {
  try {
    const raw = await request<DashboardResponse & { leaderboard?: unknown; data?: { leaderboard?: unknown } }>("/dashboard", { method: "GET", auth: false });
    if (!raw || typeof raw !== "object") return { leaderboard: [] };
    const list = Array.isArray(raw.leaderboard)
      ? raw.leaderboard
      : Array.isArray((raw as { data?: { leaderboard?: unknown } }).data?.leaderboard)
        ? (raw as { data: { leaderboard: LeaderboardEntry[] } }).data.leaderboard
        : [];
    return { ...raw, leaderboard: normalizeLeaderboard(list) };
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return { leaderboard: [] };
    throw e;
  }
}

function normalizeLeaderboard(list: unknown[]): LeaderboardEntry[] {
  return list.slice(0, 50).map((item, index) => {
    if (!item || typeof item !== "object") return { rank: index + 1 };
    const o = item as Record<string, unknown>;
    const scoreVal = o.best_score != null ? Number(o.best_score) : o.score != null ? Number(o.score) : o.skor != null ? Number(o.skor) : undefined;
    return {
      rank: Number(o.rank ?? o.urutan ?? index + 1),
      user_id: o.user_id != null ? String(o.user_id) : undefined,
      user_name: o.user_name != null ? String(o.user_name) : o.name != null ? String(o.name) : o.nama != null ? String(o.nama) : undefined,
      name: o.name != null ? String(o.name) : o.nama != null ? String(o.nama) : undefined,
      nama: o.nama != null ? String(o.nama) : undefined,
      school_name: o.school_name != null ? String(o.school_name) : undefined,
      score: scoreVal,
      skor: scoreVal,
      best_score: o.best_score != null ? Number(o.best_score) : undefined,
      has_attempt: o.has_attempt === true,
      tryout_title: o.tryout_title != null ? String(o.tryout_title) : o.tryout_name != null ? String(o.tryout_name) : undefined,
      tryout_id: o.tryout_id != null ? String(o.tryout_id) : undefined,
      ...o,
    } as LeaderboardEntry;
  });
}

// --- Student ---
/** Nama siswa dari response (user.name, user.nama, student.name, student.nama). */
export function getStudentDisplayName(dashboard: StudentDashboardResponse | null): string | null {
  if (!dashboard) return null;
  const u = dashboard.user ?? dashboard.student;
  if (!u || typeof u !== "object") return null;
  const name = (u as { name?: string; nama?: string }).name ?? (u as { name?: string; nama?: string }).nama;
  return name && String(name).trim() ? String(name).trim() : null;
}

/** GET /student/dashboard. Normalisasi rekomendasi & perlu ditingkatkan dari berbagai format backend. */
export async function getStudentDashboard(): Promise<StudentDashboardResponse> {
  const raw = await request<Record<string, unknown>>("/student/dashboard", { method: "GET" });
  if (!raw || typeof raw !== "object") {
    return {
      summary: { total_attempts: 0, avg_score: 0, avg_percentile: 0 },
      open_tryouts: [],
      recent_attempts: [],
      strength_areas: [],
      improvement_areas: [],
      recommendation: "",
    };
  }
  const data = (raw.data && typeof raw.data === "object") ? (raw.data as Record<string, unknown>) : raw;
  const arr = (v: unknown): string[] => {
    if (Array.isArray(v)) return v.map((x) => (typeof x === "string" ? x : String(x ?? "")));
    return [];
  };
  const str = (v: unknown): string => (v != null && typeof v === "string" ? v : "");
  const strength = raw.strength_areas ?? data.strength_areas ?? raw.kekuatan ?? data.kekuatan ?? raw.strengths ?? data.strengths ?? raw.strength;
  const improvement = raw.improvement_areas ?? data.improvement_areas ?? raw.perlu_ditingkatkan ?? data.perlu_ditingkatkan ?? raw.improvements ?? data.improvements ?? raw.improvement;
  const rec = raw.recommendation ?? data.recommendation ?? raw.rekomendasi ?? data.rekomendasi ?? raw.recommendation_text ?? data.recommendation_text ?? "";
  return {
    ...raw,
    summary: (raw.summary as StudentDashboardResponse["summary"]) ?? (data.summary as StudentDashboardResponse["summary"]) ?? {
      total_attempts: 0,
      avg_score: 0,
      avg_percentile: 0,
    },
    open_tryouts: Array.isArray(raw.open_tryouts) ? raw.open_tryouts : Array.isArray(data.open_tryouts) ? data.open_tryouts : [],
    recent_attempts: Array.isArray(raw.recent_attempts) ? raw.recent_attempts : Array.isArray(data.recent_attempts) ? data.recent_attempts : [],
    strength_areas: arr(strength),
    improvement_areas: arr(improvement),
    recommendation: typeof rec === "string" ? rec : str(rec),
  } as StudentDashboardResponse;
}

/** Daftar tryout untuk siswa. GET api/v1/student/tryouts. 404 = daftar kosong. */
export async function getStudentTryouts(): Promise<TryoutSession[]> {
  try {
    const raw = await request<
      TryoutSession[] | { tryouts?: TryoutSession[]; data?: TryoutSession[] }
    >("/student/tryouts", { method: "GET" });
    if (Array.isArray(raw)) return raw;
    if (raw?.tryouts && Array.isArray(raw.tryouts)) return raw.tryouts;
    if (raw?.data && Array.isArray(raw.data)) return raw.data;
    return [];
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return [];
    throw e;
  }
}

/** Daftar attempt siswa. 404 = daftar kosong. */
export async function getStudentAttempts(): Promise<Attempt[]> {
  try {
    const raw = await request<Attempt[] | { attempts?: Attempt[]; data?: Attempt[] }>("/student/attempts", { method: "GET" });
    if (Array.isArray(raw)) return raw;
    if (raw?.attempts && Array.isArray(raw.attempts)) return raw.attempts;
    if (raw?.data && Array.isArray(raw.data)) return raw.data;
    return [];
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return [];
    throw e;
  }
}

export async function getStudentAttemptDetail(
  attemptId: string
): Promise<Attempt> {
  return request(`/student/attempts/${attemptId}`, { method: "GET" });
}

/** Review soal & jawaban (benar/salah). GET /attempts/:id/review atau /student/attempts/:id/review. 404/405 = []. */
export async function getAttemptReview(attemptId: string): Promise<AttemptReviewItem[]> {
  const paths = [`/attempts/${attemptId}/review`, `/student/attempts/${attemptId}/review`];
  for (const path of paths) {
    try {
      const raw = await request<AttemptReviewResponse | AttemptReviewItem[]>(path, { method: "GET" });
      if (Array.isArray(raw)) return raw as AttemptReviewItem[];
      const list = (raw as AttemptReviewResponse).items ?? (raw as AttemptReviewResponse).questions ?? [];
      return Array.isArray(list) ? (list as AttemptReviewItem[]) : [];
    } catch (e) {
      if (isNotFoundOrMethodNotAllowed(e)) continue;
      throw e;
    }
  }
  return [];
}

/** Daftar sertifikat siswa. 404 = daftar kosong. */
export async function getStudentCertificates(): Promise<Certificate[]> {
  try {
    const raw = await request<Certificate[] | { certificates?: Certificate[]; data?: Certificate[] }>("/student/certificates", { method: "GET" });
    if (Array.isArray(raw)) return raw;
    if (raw?.certificates && Array.isArray(raw.certificates)) return raw.certificates;
    if (raw?.data && Array.isArray(raw.data)) return raw.data;
    return [];
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return [];
    throw e;
  }
}

// --- Courses ---
/** Daftar course. 404 = daftar kosong. */
export async function listCourses(): Promise<Course[]> {
  try {
    const raw = await request<Course[] | { courses?: Course[]; data?: Course[] }>("/courses/", { method: "GET", auth: false });
    if (Array.isArray(raw)) return raw;
    if (raw?.courses && Array.isArray(raw.courses)) return raw.courses;
    if (raw?.data && Array.isArray(raw.data)) return raw.data;
    return [];
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return [];
    throw e;
  }
}

export async function enrollCourse(
  courseId: string
): Promise<CourseEnrollment> {
  return request(`/courses/${courseId}/enroll`, { method: "POST" });
}

// --- Admin ---
/** GET /admin/overview. Gagal (404/405) = return null. */
export async function getAdminOverview(): Promise<AdminOverviewResponse | null> {
  try {
    const raw = await request<Record<string, unknown>>("/admin/overview", { method: "GET" });
    if (!raw || typeof raw !== "object") return null;
    return {
      total_students: Number(raw.total_students ?? raw.total_student ?? 0),
      active_tryouts: Number(raw.active_tryouts ?? raw.active_tryout ?? 0),
      avg_score: Number(raw.avg_score ?? raw.average_score ?? 0),
      total_certificates: Number(raw.total_certificates ?? raw.total_certificate ?? 0),
    };
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return null;
    throw e;
  }
}

/** Data gabungan untuk dashboard admin: overview + users + tryouts dari API. */
export interface AdminDashboardData {
  overview: AdminOverviewResponse | null;
  users: User[];
  tryouts: TryoutSession[];
  totalStudents: number;
  activeTryouts: number;
  avgScore: number;
  totalCertificates: number;
}

/** Ambil semua data untuk dashboard admin (overview, users, tryouts). Statistik diisi dari overview bila ada, else dari list. */
export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const [overviewResult, usersResult, tryoutsResult] = await Promise.allSettled([
    getAdminOverview(),
    adminListUsers(),
    adminListTryouts(),
  ]);

  const overview =
    overviewResult.status === "fulfilled" ? overviewResult.value : null;
  const users = usersResult.status === "fulfilled" ? usersResult.value : [];
  const tryouts = tryoutsResult.status === "fulfilled" ? tryoutsResult.value : [];

  const totalStudents =
    overview?.total_students ??
    users.filter((u) => u.role === "student").length;
  // Event aktif: utamakan hitung dari list tryout (status === "open"), fallback ke overview
  const openCount = tryouts.filter((t) => String(t.status).toLowerCase() === "open").length;
  const activeTryouts = tryouts.length > 0 ? openCount : (overview?.active_tryouts ?? 0);
  const avgScore = overview?.avg_score ?? 0;
  const totalCertificates = overview?.total_certificates ?? 0;

  return {
    overview,
    users,
    tryouts,
    totalStudents,
    activeTryouts,
    avgScore,
    totalCertificates,
  };
}

export async function adminListTryouts(): Promise<TryoutSession[]> {
  try {
    const raw = await request<TryoutSession[] | { tryouts?: TryoutSession[]; data?: TryoutSession[] }>("/admin/tryouts", { method: "GET" });
    if (Array.isArray(raw)) return raw;
    if (raw?.tryouts && Array.isArray(raw.tryouts)) return raw.tryouts;
    if (raw?.data && Array.isArray(raw.data)) return raw.data;
    return [];
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return [];
    throw e;
  }
}

export async function adminGetTryout(tryoutId: string): Promise<TryoutSession> {
  return request(`/admin/tryouts/${tryoutId}`, { method: "GET" });
}

/** Ambil respons mentah dari path (untuk debug). Gagal = return null. */
export async function getRawJson(path: string): Promise<unknown> {
  try {
    return await request<unknown>(path, { method: "GET" });
  } catch {
    return null;
  }
}

/** Normalisasi objek dari API ke bentuk Sekolah (field nama bisa beda). */
function normalizeToSekolah(item: Record<string, unknown>): Sekolah {
  const id = String(item.id ?? item.school_id ?? "");
  const nama_sekolah =
    String(
      item.nama_sekolah ??
        item.nama ??
        item.name ??
        item.school_name ??
        ""
    ).trim() || "—";
  return {
    id: id || crypto.randomUUID(),
    nama_sekolah,
    npsn: item.npsn != null ? String(item.npsn) : null,
    kabupaten_kota:
      item.kabupaten_kota != null
        ? String(item.kabupaten_kota)
        : item.kabupaten != null
          ? String(item.kabupaten)
          : item.kota != null
            ? String(item.kota)
            : null,
    telepon: item.telepon != null ? String(item.telepon) : item.phone != null ? String(item.phone) : null,
    alamat: item.alamat != null ? String(item.alamat) : item.address != null ? String(item.address) : null,
  };
}

/** Daftar sekolah (GET api/v1/admin/master-data/sekolah). 404/405 = daftar kosong. */
export async function adminListSekolah(): Promise<Sekolah[]> {
  try {
    const raw = await request<unknown>("/admin/master-data/sekolah", {
      method: "GET",
    });
    if (Array.isArray(raw)) {
      return raw.map((x) => normalizeToSekolah(typeof x === "object" && x ? (x as Record<string, unknown>) : {}));
    }
    const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
    const arr =
      Array.isArray(obj.schools)
        ? obj.schools
        : Array.isArray(obj.sekolah)
          ? obj.sekolah
          : Array.isArray(obj.data)
            ? obj.data
            : Array.isArray(obj.list)
              ? obj.list
              : Array.isArray(obj.results)
                ? obj.results
                : Array.isArray(obj.items)
                  ? obj.items
                  : null;
    if (arr && arr.length > 0) {
      return arr.map((x) =>
        normalizeToSekolah(typeof x === "object" && x ? (x as Record<string, unknown>) : {})
      );
    }
    return [];
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return [];
    throw e;
  }
}

/** Daftar dari API hasil kelas (GET api/v1/admin/kelas atau path lain). Untuk tampil di master sekolah jika backend mengembalikan data kelas/sekolah di sini. */
export async function adminListHasilKelas(): Promise<Sekolah[]> {
  try {
    const raw = await request<unknown>("/admin/kelas", { method: "GET" });
    if (Array.isArray(raw)) {
      return raw.map((x) => normalizeToSekolah(typeof x === "object" && x ? (x as Record<string, unknown>) : {}));
    }
    const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
    const arr = Array.isArray(obj.data)
      ? obj.data
      : Array.isArray(obj.kelas)
        ? obj.kelas
        : Array.isArray(obj.list)
          ? obj.list
          : Array.isArray(obj.results)
            ? obj.results
            : Array.isArray(obj.items)
              ? obj.items
              : null;
    if (arr && arr.length > 0) {
      return arr.map((x) =>
        normalizeToSekolah(typeof x === "object" && x ? (x as Record<string, unknown>) : {})
      );
    }
    return [];
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return [];
    throw e;
  }
}

export async function adminCreateTryout(
  body: AdminCreateTryoutRequest
): Promise<TryoutSession> {
  return request("/admin/tryouts", { method: "POST", body });
}

export async function adminUpdateTryout(
  tryoutId: string,
  body: Partial<AdminCreateTryoutRequest>
): Promise<Record<string, never>> {
  return request(`/admin/tryouts/${tryoutId}`, { method: "PUT", body });
}

export async function adminDeleteTryout(
  tryoutId: string
): Promise<void> {
  return request(`/admin/tryouts/${tryoutId}`, { method: "DELETE" });
}

/** Daftar soal tryout. 404/405 = daftar kosong. */
export async function adminListTryoutQuestions(
  tryoutId: string
): Promise<Question[]> {
  try {
    const raw = await request<
      Question[] | { questions?: Question[]; data?: Question[] }
    >(`/admin/tryouts/${tryoutId}/questions`, { method: "GET" });
    if (Array.isArray(raw)) return raw;
    if (raw?.questions && Array.isArray(raw.questions)) return raw.questions;
    if (raw?.data && Array.isArray(raw.data)) return raw.data;
    return [];
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return [];
    throw e;
  }
}

/** Satu soal by id (GET /admin/tryouts/{tryoutId}/questions/{questionId}). */
export async function adminGetQuestion(
  tryoutId: string,
  questionId: string
): Promise<Question> {
  return request(`/admin/tryouts/${tryoutId}/questions/${questionId}`, {
    method: "GET",
  });
}

export async function adminCreateQuestion(
  tryoutId: string,
  body: AdminCreateQuestionRequest
): Promise<Question> {
  return request(`/admin/tryouts/${tryoutId}/questions`, {
    method: "POST",
    body,
  });
}

/** Update question (PUT /admin/tryouts/{tryoutId}/questions/{questionId}). */
export async function adminUpdateQuestion(
  tryoutId: string,
  questionId: string,
  body: Partial<AdminCreateQuestionRequest>
): Promise<Question> {
  return request(`/admin/tryouts/${tryoutId}/questions/${questionId}`, {
    method: "PUT",
    body,
  });
}

/** Delete question (DELETE /admin/tryouts/{tryoutId}/questions/{questionId}). */
export async function adminDeleteQuestion(
  tryoutId: string,
  questionId: string
): Promise<void> {
  return request(`/admin/tryouts/${tryoutId}/questions/${questionId}`, {
    method: "DELETE",
  });
}

export async function adminCreateCourse(
  body: AdminCreateCourseRequest
): Promise<Course> {
  return request("/admin/courses", { method: "POST", body });
}

/** Daftar enrollment per course. 404 = daftar kosong. */
export async function adminGetCourseEnrollments(
  courseId: string
): Promise<CourseEnrollment[]> {
  try {
    const raw = await request<CourseEnrollment[] | { enrollments?: CourseEnrollment[]; data?: CourseEnrollment[] }>(`/admin/courses/${courseId}/enrollments`, { method: "GET" });
    if (Array.isArray(raw)) return raw;
    if (raw?.enrollments && Array.isArray(raw.enrollments)) return raw.enrollments;
    if (raw?.data && Array.isArray(raw.data)) return raw.data;
    return [];
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return [];
    throw e;
  }
}

export async function adminIssueCertificate(
  body: AdminIssueCertificateRequest
): Promise<Certificate> {
  return request("/admin/certificates", { method: "POST", body });
}

// --- Admin Roles ---
/** Daftar role dari GET /admin/roles. 404 = daftar kosong. */
export async function adminListRoles(): Promise<Role[]> {
  try {
    const raw = await request<
      Role[] | { roles?: Role[]; data?: Role[] }
    >("/admin/roles", { method: "GET" });
    if (Array.isArray(raw)) return raw;
    if (raw?.roles && Array.isArray(raw.roles)) return raw.roles;
    if (raw?.data && Array.isArray(raw.data)) return raw.data;
    return [];
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return [];
    throw e;
  }
}

// --- Admin Levels (Jenjang Pendidikan) ---
/** Daftar levels. 404 = daftar kosong. */
export async function adminListLevels(): Promise<Level[]> {
  try {
    const raw = await request<
      Level[] | { levels?: Level[]; data?: Level[] }
    >("/admin/levels", { method: "GET" });
    if (Array.isArray(raw)) return raw;
    if (raw?.levels && Array.isArray(raw.levels)) return raw.levels;
    if (raw?.data && Array.isArray(raw.data)) return raw.data;
    return [];
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return [];
    throw e;
  }
}

export async function adminCreateLevel(
  body: AdminCreateLevelRequest
): Promise<Level> {
  return request("/admin/levels", { method: "POST", body });
}

export async function adminGetLevel(levelId: string): Promise<Level> {
  return request(`/admin/levels/${levelId}`, { method: "GET" });
}

export async function adminUpdateLevel(
  levelId: string,
  body: AdminUpdateLevelRequest
): Promise<Level> {
  return request(`/admin/levels/${levelId}`, { method: "PUT", body });
}

/** Subject per level. 404 = daftar kosong. */
export async function adminGetLevelSubjects(
  levelId: string
): Promise<Subject[]> {
  try {
    const raw = await request<
      Subject[] | { subjects?: Subject[]; data?: Subject[] }
    >(`/admin/levels/${levelId}/subjects`, { method: "GET" });
    if (Array.isArray(raw)) return raw;
    if (raw?.subjects && Array.isArray(raw.subjects)) return raw.subjects;
    if (raw?.data && Array.isArray(raw.data)) return raw.data;
    return [];
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return [];
    throw e;
  }
}

// --- Admin Users (GET/POST/PUT api/v1/admin/users) ---
/** Daftar semua user. GET api/v1/admin/users. 404 = daftar kosong. */
export async function adminListUsers(): Promise<User[]> {
  try {
    const raw = await request<User[] | { users?: User[]; data?: User[] }>(
      "/admin/users",
      { method: "GET" }
    );
    if (Array.isArray(raw)) return raw;
    if (raw?.users && Array.isArray(raw.users)) return raw.users;
    if (raw?.data && Array.isArray(raw.data)) return raw.data;
    return [];
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return [];
    throw e;
  }
}

export async function adminCreateUser(
  body: AdminCreateUserRequest
): Promise<User> {
  return request("/admin/users", { method: "POST", body });
}

export async function adminGetUser(userId: string): Promise<User> {
  return request(`/admin/users/${userId}`, { method: "GET" });
}

export async function adminUpdateUser(
  userId: string,
  body: AdminUpdateUserRequest
): Promise<User> {
  return request(`/admin/users/${userId}`, { method: "PUT", body });
}

// --- Admin Subjects (Bidang) ---
/** Daftar subject. 404 = daftar kosong. */
export async function adminListSubjects(): Promise<Subject[]> {
  try {
    const raw = await request<Subject[] | { subjects?: Subject[]; data?: Subject[] }>("/admin/subjects", { method: "GET" });
    if (Array.isArray(raw)) return raw;
    if (raw?.subjects && Array.isArray(raw.subjects)) return raw.subjects;
    if (raw?.data && Array.isArray(raw.data)) return raw.data;
    return [];
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return [];
    throw e;
  }
}

export async function adminCreateSubject(
  body: AdminCreateSubjectRequest
): Promise<Subject> {
  return request("/admin/subjects", { method: "POST", body });
}

export async function adminUpdateSubject(
  subjectId: string,
  body: Partial<AdminCreateSubjectRequest>
): Promise<Record<string, never>> {
  return request(`/admin/subjects/${subjectId}`, { method: "PUT", body });
}

export async function adminDeleteSubject(subjectId: string): Promise<void> {
  return request(`/admin/subjects/${subjectId}`, { method: "DELETE" });
}

// --- Admin Courses by Subject ---
/** Daftar course per subject. 404 = daftar kosong. */
export async function adminListCoursesBySubject(
  subjectId: string
): Promise<Course[]> {
  try {
    const raw = await request<Course[] | { courses?: Course[]; data?: Course[] }>(`/admin/subjects/${subjectId}/courses`, { method: "GET" });
    if (Array.isArray(raw)) return raw;
    if (raw?.courses && Array.isArray(raw.courses)) return raw.courses;
    if (raw?.data && Array.isArray(raw.data)) return raw.data;
    return [];
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return [];
    throw e;
  }
}

export async function adminCreateCourseUnderSubject(
  subjectId: string,
  body: { title: string; description?: string | null; sort_order?: number }
): Promise<Course> {
  return request(`/admin/subjects/${subjectId}/courses`, {
    method: "POST",
    body: { ...body, subject_id: subjectId },
  });
}

export async function adminUpdateCourse(
  courseId: string,
  body: Partial<AdminCreateCourseRequest>
): Promise<Record<string, never>> {
  return request(`/admin/courses/${courseId}`, { method: "PUT", body });
}

export async function adminDeleteCourse(courseId: string): Promise<void> {
  return request(`/admin/courses/${courseId}`, { method: "DELETE" });
}
