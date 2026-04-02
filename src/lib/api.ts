/**
 * API client for FansEdu LMS v1 (Go backend).
 * Set NEXT_PUBLIC_API_URL in .env (e.g. http://localhost:8080).
 */

import type {
  AdminCreateCourseRequest,
  AdminCreateLevelRequest,
  AdminCreateQuestionRequest,
  AdminUpdateQuestionRequest,
  AdminCreateSubjectRequest,
  AdminCreateTryoutRequest,
  AdminCreateUserRequest,
  AdminIssueCertificateRequest,
  AdminOverviewResponse,
  AdminTryoutAnalysis,
  AdminTryoutAttemptAiAnalysis,
  AdminTryoutStudent,
  AdminUpdateLevelRequest,
  AdminUpdateUserRequest,
  Attempt,
  AttemptAnswerReviewSaveResponse,
  AttemptReviewItem,
  AttemptReviewResponse,
  Certificate,
  Course,
  CourseEnrollment,
  ChangePasswordRequest,
  CreatePaymentRequest,
  CourseDiscussion,
  CourseMessage,
  DashboardResponse,
  DiscussionReply,
  ForgotPasswordRequest,
  LeaderboardEntry,
  Level,
  LoginRequest,
  LoginResponse,
  Notification,
  Payment,
  PutAnswerRequest,
  Question,
  QuestionStats,
  RegisterRequest,
  RegisterResponse,
  ResetPasswordRequest,
  Role,
  Sekolah,
  StudentDashboardResponse,
  Subject,
  SubmitAttemptResponse,
  StartTryoutResponse,
  TrainerAddStudentRequest,
  TrainerCourseCreateRequest,
  TrainerPayRequest,
  TrainerProfileResponse,
  TrainerProfileUpdateRequest,
  TrainerCreateSchoolRequest,
  TrainerStatusResponse,
  TryoutQuestionStatsBulkResponse,
  TryoutAutoGradeSubmittedResponse,
  TryoutSession,
  User,
  UserRole,
  LandingPackage,
  AdminLandingPackageCreateRequest,
  AdminLandingPackageUpdateRequest,
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
    return "Tidak dapat terhubung ke server. Pastikan backend API berjalan (development: jalankan server Go di http://localhost:8080) dan NEXT_PUBLIC_API_URL di .env benar (lokal: http://localhost:8080).";
  }
  if (e?.message && e.message.trim()) {
    return e.message.trim();
  }
  return "Terjadi kesalahan. Silakan coba lagi.";
}

/**
 * URL dasar untuk panggilan API.
 * - Browser: pakai NEXT_PUBLIC_API_URL jika ada (langsung ke api.fansedu.web.id), agar request ke backend Go.
 *   Jika tidak diset, fallback same-origin /api/v1 (proxy Next.js). Backend Go harus allow CORS dari origin frontend.
 * - Server: selalu NEXT_PUBLIC_API_URL (backend Go).
 */
function getBaseUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const base = apiUrl
    ? apiUrl.replace(/\/$/, "")
    : typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:8080";
  return base + "/api/v1";
}

const BASE = typeof window !== "undefined" ? getBaseUrl() : getBaseUrl();

/** Cegah beberapa redirect bersamaan jika banyak request gagal 401 sekaligus. */
let unauthorizedRedirectScheduled = false;

/**
 * Saat backend mengembalikan 401 pada request yang mengharapkan auth (token kedaluwarsa / tidak valid):
 * bersihkan cookie + Zustand, lalu alihkan ke halaman login.
 * Tidak dipanggil untuk `auth: false` (mis. login/register) agar error kredensial tetap ditampilkan di form.
 */
function scheduleUnauthorizedRedirect(): void {
  if (typeof window === "undefined" || unauthorizedRedirectScheduled) return;
  unauthorizedRedirectScheduled = true;
  void import("@/store/auth").then(({ useAuthStore }) => {
    useAuthStore.getState().clearAuth();
    const next = `${window.location.pathname}${window.location.search}`;
    const qs = new URLSearchParams({ session: "expired" });
    if (next && next !== "/login") qs.set("next", next);
    window.location.assign(`/login?${qs.toString()}`);
  });
}

function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/auth_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

const AUTH_NAME_KEY = "auth_user_name";

export function setAuthToken(
  token: string,
  maxAgeSeconds = 604800,
  role?: UserRole,
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

export function getAuthRole(): UserRole | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/auth_role=([^;]+)/);
  const role = match ? decodeURIComponent(match[1]) : null;
  if (role === "admin" || role === "student" || role === "trainer") return role;
  if (role === "guru") return "trainer";
  return null;
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

function toCamelCaseKey(key: string): string {
  return key
    .replace(/[_-\s]+([a-zA-Z0-9])/g, (_, c: string) => c.toUpperCase())
    .replace(/^([A-Z])/, (m) => m.toLowerCase());
}

function deepToCamelCase<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((v) => deepToCamelCase(v)) as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    Object.entries(value as Record<string, unknown>).forEach(([k, v]) => {
      out[toCamelCaseKey(k)] = deepToCamelCase(v);
    });
    return out as T;
  }
  return value;
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
  const normalizedBody =
    hasBody && body && typeof body === "object"
      ? deepToCamelCase(body)
      : body;
  let res: Response;
  try {
    res = await fetch(url, {
      method: verb,
      headers,
      body: hasBody ? JSON.stringify(normalizedBody) : undefined,
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
  const rawData = await res.json().catch(() => ({}));
  const data = deepToCamelCase(rawData);
  if (!res.ok) {
    if (auth && res.status === 401) {
      scheduleUnauthorizedRedirect();
    }
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

/** Normalisasi TryoutSession (JSON API camelCase). */
function normalizeToTryoutSession(item: unknown): TryoutSession {
  const obj = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
  return {
    id: String(obj.id ?? ""),
    title: String(obj.title ?? ""),
    shortTitle: obj.shortTitle != null ? String(obj.shortTitle) : null,
    description: obj.description != null ? String(obj.description) : null,
    durationMinutes: Number(obj.durationMinutes ?? 0),
    questionsCount: Number(obj.questionsCount ?? 0),
    level: String(obj.level ?? "medium") as TryoutSession["level"],
    opensAt: String(obj.opensAt ?? ""),
    closesAt: String(obj.closesAt ?? ""),
    maxParticipants:
      obj.maxParticipants != null ? Number(obj.maxParticipants) : null,
    status: String(obj.status ?? "draft") as TryoutSession["status"],
    eventCategory:
      obj.eventCategory != null ? String(obj.eventCategory) : null,
  };
}

function pickFiniteNumber(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return undefined;
}

function pickBestScoreValue(candidates: unknown[]): number | undefined {
  const nums = candidates.map(pickFiniteNumber).filter((n): n is number => n != null);
  if (nums.length === 0) return undefined;
  // Hindari "terjebak" score default 0 bila ada kandidat nilai final > 0.
  const positives = nums.filter((n) => n > 0);
  if (positives.length > 0) return positives[0];
  return nums[0];
}

/** Bersihkan payload tryout sebelum dikirim; request() mengonversi key ke camelCase. */
function toTryoutApiPayload(
  body: AdminCreateTryoutRequest | Partial<AdminCreateTryoutRequest>
): Record<string, unknown> {
  const payload: Record<string, unknown> = { ...(body as Record<string, unknown>) };
  // Buang undefined agar update parsial tetap bersih.
  Object.keys(payload).forEach((k) => {
    if (payload[k] === undefined) delete payload[k];
  });
  return payload;
}

/** Opsi dari API: objek { key, label, correct } atau legacy array string. */
function normalizeQuestionOptionsFromRaw(raw: unknown): Question["options"] {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  return raw.map((item, i) => {
    if (item && typeof item === "object" && !Array.isArray(item)) {
      const o = item as Record<string, unknown>;
      return {
        key: String(o.key ?? String.fromCharCode(65 + i)),
        label: String(o.label ?? o.text ?? ""),
        correct: o.correct === true,
      };
    }
    return {
      key: String.fromCharCode(65 + i),
      label: String(item),
      correct: false,
    };
  });
}

/** Satu soal: dipetakan ke Question setelah response dinormalisasi ke camelCase. */
function normalizeQuestion(item: unknown): Question {
  const obj = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
  const typeRaw = obj.type;
  const type: Question["type"] =
    typeRaw === "short" || typeRaw === "multiple_choice" || typeRaw === "true_false"
      ? typeRaw
      : "short";
  const co = obj.correctOption ?? obj.correct_option;
  const ct = obj.correctText ?? obj.correct_text;
  const correctOption =
    co != null && String(co).trim() !== "" ? String(co).trim() : null;
  const correctText = ct != null && String(ct).trim() !== "" ? String(ct) : null;
  return {
    id: String(obj.id ?? ""),
    tryoutSessionId: String(obj.tryoutSessionId ?? ""),
    sortOrder: Number(obj.sortOrder ?? 0),
    type,
    body: String(obj.body ?? ""),
    options: normalizeQuestionOptionsFromRaw(obj.options),
    maxScore: Number(obj.maxScore ?? 0),
    correctOption,
    correctText,
    imageUrl: obj.imageUrl != null ? String(obj.imageUrl) : null,
  };
}

// --- Health ---
export async function healthCheck(): Promise<{ status: string; time: string }> {
  return request("/health", { method: "GET", auth: false });
}

// --- Public (no auth) ---
/** GET /roles — daftar role untuk register/dropdown. */
export async function getPublicRoles(): Promise<Role[]> {
  try {
    const raw = await request<Role[] | { roles?: Role[]; data?: Role[] }>("/roles", { method: "GET", auth: false });
    if (Array.isArray(raw)) return raw;
    const obj = raw && typeof raw === "object" ? (raw as { roles?: Role[]; data?: Role[] }) : {};
    return Array.isArray(obj.roles) ? obj.roles : Array.isArray(obj.data) ? obj.data : [];
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return [];
    throw e;
  }
}

/** GET /schools — daftar sekolah (public). */
export async function getPublicSchools(): Promise<Sekolah[]> {
  try {
    const raw = await request<unknown>("/schools", { method: "GET", auth: false });
    if (Array.isArray(raw)) return raw.map((x) => normalizeToSekolah(typeof x === "object" && x ? (x as Record<string, unknown>) : {}));
    const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
    const arr = Array.isArray(obj.schools) ? obj.schools : Array.isArray(obj.data) ? obj.data : null;
    if (arr?.length) return arr.map((x) => normalizeToSekolah(typeof x === "object" && x ? (x as Record<string, unknown>) : {}));
    return [];
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return [];
    throw e;
  }
}

// --- Landing packages (public) ---
/** Publik: GET /packages — untuk halaman landing. */
export async function getLandingPackages(): Promise<LandingPackage[]> {
  try {
    const raw = await request<unknown>("/packages", { method: "GET", auth: false });
    if (Array.isArray(raw)) return raw as LandingPackage[];
    const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
    const arr = Array.isArray(obj.packages) ? obj.packages : Array.isArray(obj.data) ? obj.data : null;
    return (arr ?? []) as LandingPackage[];
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return [];
    throw e;
  }
}

// --- Admin Landing packages ---
/** Admin: GET /admin/landing/packages */
export async function adminLandingListPackages(): Promise<LandingPackage[]> {
  try {
    const raw = await request<unknown>("/admin/landing/packages", { method: "GET" });
    if (Array.isArray(raw)) return raw as LandingPackage[];
    const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
    const arr = Array.isArray(obj.packages) ? obj.packages : Array.isArray(obj.data) ? obj.data : null;
    return (arr ?? []) as LandingPackage[];
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return [];
    throw e;
  }
}

/** Admin: POST /admin/landing/packages */
export async function adminLandingCreatePackage(body: AdminLandingPackageCreateRequest): Promise<LandingPackage> {
  return request("/admin/landing/packages", { method: "POST", body });
}

/** Admin: PUT /admin/landing/packages/:id */
export async function adminLandingUpdatePackage(
  packageId: string,
  body: AdminLandingPackageUpdateRequest
): Promise<LandingPackage> {
  return request(`/admin/landing/packages/${packageId}`, { method: "PUT", body });
}

/** Admin: DELETE /admin/landing/packages/:id */
export async function adminLandingDeletePackage(packageId: string): Promise<{ ok: boolean } | void> {
  return request(`/admin/landing/packages/${packageId}`, { method: "DELETE" });
}

/** GET /levels — jenjang pendidikan (public). */
export async function getPublicLevels(): Promise<Level[]> {
  try {
    const raw = await request<Level[] | { levels?: Level[]; data?: Level[] }>("/levels", { method: "GET", auth: false });
    if (Array.isArray(raw)) return raw;
    const obj = raw && typeof raw === "object" ? (raw as { levels?: Level[]; data?: Level[] }) : {};
    return Array.isArray(obj.levels) ? obj.levels : Array.isArray(obj.data) ? obj.data : [];
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return [];
    throw e;
  }
}

// --- Auth ---
/** Login: jika NEXT_PUBLIC_API_URL diset → POST langsung ke backend (api.fansedu.web.id/api/v1/auth/login). Tanpa itu → proxy same-origin /api/auth/login (dev). */
export async function login(body: LoginRequest): Promise<LoginResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl) {
    const base = apiUrl.replace(/\/$/, "") + "/api/v1";
    return request("/auth/login", { method: "POST", body, auth: false }, { baseUrl: base });
  }
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return request("/api/auth/login", { method: "POST", body, auth: false }, { baseUrl: origin });
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

/** Ubah kata sandi (user sudah login). POST /auth/change-password. */
export async function changePassword(body: ChangePasswordRequest): Promise<{ ok: boolean }> {
  return request("/auth/change-password", { method: "POST", body });
}

// --- Notifications ---
/** GET /notifications — daftar notifikasi user (Bearer). */
export async function listNotifications(): Promise<Notification[]> {
  try {
    const raw = await request<Notification[] | { notifications?: Notification[]; data?: Notification[] }>("/notifications", { method: "GET" });
    if (Array.isArray(raw)) return raw;
    const obj = raw && typeof raw === "object" ? (raw as { notifications?: Notification[]; data?: Notification[] }) : {};
    return Array.isArray(obj.notifications) ? obj.notifications : Array.isArray(obj.data) ? obj.data : [];
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return [];
    throw e;
  }
}

/** PATCH /notifications/:id/read — tandai sudah dibaca. */
export async function markNotificationRead(id: string): Promise<{ ok?: boolean }> {
  return request(`/notifications/${id}/read`, { method: "PATCH" });
}

// --- Payments (user) ---
/** GET /payments — riwayat pembayaran user (Bearer). */
export async function listPayments(): Promise<Payment[]> {
  try {
    const raw = await request<Payment[] | { payments?: Payment[]; data?: Payment[] }>("/payments", { method: "GET" });
    if (Array.isArray(raw)) return raw;
    const obj = raw && typeof raw === "object" ? (raw as { payments?: Payment[]; data?: Payment[] }) : {};
    return Array.isArray(obj.payments) ? obj.payments : Array.isArray(obj.data) ? obj.data : [];
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return [];
    throw e;
  }
}

/** POST /payments — buat pembayaran (upload bukti, dll). */
export async function createPayment(body: CreatePaymentRequest): Promise<Payment> {
  return request("/payments", { method: "POST", body });
}

/** GET /admin/payments — daftar semua pembayaran untuk verifikasi admin. 404/405 = []. */
export async function adminListPayments(): Promise<Payment[]> {
  try {
    const raw = await request<Payment[] | { payments?: Payment[]; data?: Payment[] }>("/admin/payments", {
      method: "GET",
    });
    if (Array.isArray(raw)) return raw;
    const obj = raw && typeof raw === "object" ? (raw as { payments?: Payment[]; data?: Payment[] }) : {};
    return Array.isArray(obj.payments) ? obj.payments : Array.isArray(obj.data) ? obj.data : [];
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return [];
    throw e;
  }
}

/** POST /admin/payments/:id/confirm — konfirmasi pembayaran (admin). */
export async function adminConfirmPayment(paymentId: string): Promise<Payment> {
  return request(`/admin/payments/${paymentId}/confirm`, { method: "POST" });
}

/** POST /admin/payments/:id/reject — tolak pembayaran (admin). */
export async function adminRejectPayment(paymentId: string, body?: { reason?: string }): Promise<Payment> {
  return request(`/admin/payments/${paymentId}/reject`, { method: "POST", body: body ?? {} });
}

/** GET /trainer/payments — riwayat pembayaran milik trainer (slot, dll). 404/405 = []. */
export async function trainerListPayments(): Promise<Payment[]> {
  try {
    const raw = await request<Payment[] | { payments?: Payment[]; data?: Payment[] }>("/trainer/payments", {
      method: "GET",
    });
    if (Array.isArray(raw)) return raw;
    const obj = raw && typeof raw === "object" ? (raw as { payments?: Payment[]; data?: Payment[] }) : {};
    return Array.isArray(obj.payments) ? obj.payments : Array.isArray(obj.data) ? obj.data : [];
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return [];
    throw e;
  }
}

// --- Trainer (Guru) ---
/** Status slot & siswa guru. 404/405 = { paidSlots: 0, registeredStudentsCount: 0 }. includeStudents=true → GET /trainer/status?students=1 */
export async function getTrainerStatus(includeStudents?: boolean): Promise<TrainerStatusResponse> {
  try {
    const path = includeStudents ? "/trainer/status?students=1" : "/trainer/status";
    const raw = await request<Record<string, unknown>>(path, { method: "GET" });
    if (!raw || typeof raw !== "object") {
      return { paidSlots: 0, registeredStudentsCount: 0 };
    }
    const data = (raw.data && typeof raw.data === "object") ? (raw.data as Record<string, unknown>) : raw;
    const paid =
      typeof raw.paidSlots === "number"
        ? raw.paidSlots
        : typeof data.paidSlots === "number"
          ? data.paidSlots
          : Number(raw.slotsPaid ?? data.slotsPaid ?? 0) || 0;
    const count =
      typeof raw.registeredStudentsCount === "number"
        ? raw.registeredStudentsCount
        : typeof data.registeredStudentsCount === "number"
          ? data.registeredStudentsCount
          : Number(raw.studentsCount ?? data.studentsCount ?? raw.registeredCount ?? 0) || 0;
    const students = Array.isArray(raw.students) ? raw.students : Array.isArray(data.students) ? data.students : undefined;
    return {
      paidSlots: paid,
      registeredStudentsCount: count,
      students: Array.isArray(students) ? students.map((s: Record<string, unknown>) => ({
        id: String(s.id ?? ""),
        name: String(s.name ?? s.nama ?? ""),
        email: String(s.email ?? ""),
      })) : undefined,
    };
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return { paidSlots: 0, registeredStudentsCount: 0 };
    throw e;
  }
}

/** Bayar slot pendaftaran siswa (guru). POST /trainer/pay. */
export async function trainerPaySlots(body: TrainerPayRequest): Promise<{ ok: boolean; paidSlots?: number }> {
  return request("/trainer/pay", { method: "POST", body });
}

/** Daftarkan siswa oleh guru. POST /trainer/students. Hanya bisa jika ada slot (paidSlots > registeredStudentsCount). */
export async function trainerAddStudent(body: TrainerAddStudentRequest): Promise<{ id: string; email: string }> {
  return request("/trainer/students", { method: "POST", body });
}

/** Profil guru (nama, email, sekolah). GET /trainer/profile. 404 = null. */
export async function getTrainerProfile(): Promise<TrainerProfileResponse | null> {
  try {
    const raw = await request<Record<string, unknown>>("/trainer/profile", { method: "GET" });
    if (!raw || typeof raw !== "object") return null;
    const data = (raw.data && typeof raw.data === "object") ? (raw.data as Record<string, unknown>) : raw;
    const name = typeof raw.name === "string" ? raw.name : typeof data.name === "string" ? data.name : undefined;
    const email = typeof raw.email === "string" ? raw.email : typeof data.email === "string" ? data.email : undefined;
    const schoolRaw = raw.school ?? data.school ?? raw.sekolah ?? data.sekolah;
    let school: TrainerProfileResponse["school"] = null;
    if (schoolRaw && typeof schoolRaw === "object") {
      const s = schoolRaw as Record<string, unknown>;
      school = {
        id: String(s.id ?? ""),
        namaSekolah: String(s.namaSekolah ?? s.nama ?? ""),
        npsn: s.npsn != null ? String(s.npsn) : null,
        kabupatenKota:
          s.kabupatenKota != null
            ? String(s.kabupatenKota)
            : s.kabupaten != null
              ? String(s.kabupaten)
              : s.kota != null
                ? String(s.kota)
                : null,
        telepon: s.telepon != null ? String(s.telepon) : s.phone != null ? String(s.phone) : null,
        alamat: s.alamat != null ? String(s.alamat) : s.address != null ? String(s.address) : null,
      };
    }
    return { name, email, school };
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return null;
    throw e;
  }
}

/** Update profil guru (nama). PUT /trainer/profile. */
export async function updateTrainerProfile(body: TrainerProfileUpdateRequest): Promise<{ ok: boolean }> {
  return request("/trainer/profile", { method: "PUT", body });
}

/** Daftar sekolah untuk guru (pilih/kaitkan). GET /trainer/schools. 404/405 = []. */
export async function listTrainerSchools(): Promise<Sekolah[]> {
  try {
    const raw = await request<unknown>("/trainer/schools", { method: "GET" });
    if (Array.isArray(raw)) {
      return raw.map((x) => normalizeToSekolah(typeof x === "object" && x ? (x as Record<string, unknown>) : {}));
    }
    const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
    const arr = Array.isArray(obj.schools) ? obj.schools : Array.isArray(obj.sekolah) ? obj.sekolah : Array.isArray(obj.data) ? obj.data : null;
    if (arr && arr.length > 0) {
      return arr.map((x) => normalizeToSekolah(typeof x === "object" && x ? (x as Record<string, unknown>) : {}));
    }
    return [];
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return [];
    throw e;
  }
}

/** Buat sekolah baru oleh guru. POST /trainer/schools. Mengembalikan sekolah yang dibuat (dengan id). */
export async function createTrainerSchool(body: TrainerCreateSchoolRequest): Promise<Sekolah> {
  const raw = await request<Record<string, unknown>>("/trainer/schools", { method: "POST", body });
  if (!raw || typeof raw !== "object") throw new Error("Respons tidak valid.");
  const data = (raw.data && typeof raw.data === "object")
    ? (raw.data as Record<string, unknown>)
    : (raw.school && typeof raw.school === "object")
      ? (raw.school as Record<string, unknown>)
      : raw;
  return normalizeToSekolah(data);
}

/** Daftar kelas trainer. GET /trainer/courses (Bearer). */
export async function listTrainerCourses(): Promise<Course[]> {
  try {
    const raw = await request<Course[] | { courses?: Course[]; data?: Course[] }>("/trainer/courses", { method: "GET" });
    if (Array.isArray(raw)) return raw;
    const obj = raw && typeof raw === "object" ? (raw as { courses?: Course[]; data?: Course[] }) : {};
    return Array.isArray(obj.courses) ? obj.courses : Array.isArray(obj.data) ? obj.data : [];
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return [];
    throw e;
  }
}

/** Buat kelas oleh trainer. POST /trainer/courses. */
export async function createTrainerCourse(body: TrainerCourseCreateRequest): Promise<Course> {
  return request("/trainer/courses", { method: "POST", body });
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
    return normalizeLeaderboard(list as unknown[]);
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

/** Daftar tryout (siswa). POST /tryouts/:tryoutId/register. */
export async function registerTryout(tryoutId: string): Promise<{ ok?: boolean }> {
  return request(`/tryouts/${tryoutId}/register`, { method: "POST" });
}

// --- Attempts ---
/** Soal untuk attempt. 404 = daftar kosong. */
export async function getAttemptQuestions(
  attemptId: string
): Promise<Question[]> {
  try {
    const raw = await request<
      unknown[] | { questions?: unknown[]; data?: unknown[] }
    >(`/attempts/${attemptId}/questions`, { method: "GET" });
    let list: unknown[] = [];
    if (Array.isArray(raw)) list = raw;
    else if (raw && typeof raw === "object") {
      const o = raw as { questions?: unknown[]; data?: unknown[] };
      if (Array.isArray(o.questions)) list = o.questions;
      else if (Array.isArray(o.data)) list = o.data;
    }
    return list.map(normalizeQuestion);
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

function pickLeaderboardScore(o: Record<string, unknown>): number | undefined {
  return pickBestScoreValue([
    o.bestScore,
    o.finalScore,
    o.totalScore,
    o.attemptScore,
    o.points,
    o.nilai,
    o.score,
    o.skor,
  ]);
}

function normalizeLeaderboard(list: unknown[]): LeaderboardEntry[] {
  return list.slice(0, 50).map((item, index) => {
    if (!item || typeof item !== "object") return { rank: index + 1 };
    const o = item as Record<string, unknown>;
    const scoreVal = pickLeaderboardScore(o);
    const bestNum =
      o.bestScore != null && Number.isFinite(Number(o.bestScore)) ? Number(o.bestScore) : scoreVal;
    /** Spread dulu baru field dinormalisasi agar `...o` tidak menimpa score dengan 0 dari API. */
    return {
      ...o,
      rank: Number(o.rank ?? o.urutan ?? index + 1),
      userId: o.userId != null ? String(o.userId) : undefined,
      userName:
        o.userName != null ? String(o.userName) : o.name != null ? String(o.name) : o.nama != null ? String(o.nama) : undefined,
      name: o.name != null ? String(o.name) : o.nama != null ? String(o.nama) : undefined,
      nama: o.nama != null ? String(o.nama) : undefined,
      schoolName: o.schoolName != null ? String(o.schoolName) : undefined,
      score: scoreVal,
      skor: scoreVal,
      bestScore: bestNum,
      hasAttempt: o.hasAttempt === true,
      tryoutTitle:
        o.tryoutTitle != null ? String(o.tryoutTitle) : o.tryoutName != null ? String(o.tryoutName) : undefined,
      tryoutId: o.tryoutId != null ? String(o.tryoutId) : undefined,
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
      summary: { totalAttempts: 0, avgScore: 0, avgPercentile: 0 },
      openTryouts: [],
      recentAttempts: [],
      strengthAreas: [],
      improvementAreas: [],
      recommendation: "",
    };
  }
  const data = (raw.data && typeof raw.data === "object") ? (raw.data as Record<string, unknown>) : raw;
  const arr = (v: unknown): string[] => {
    if (Array.isArray(v)) return v.map((x) => (typeof x === "string" ? x : String(x ?? "")));
    return [];
  };
  const str = (v: unknown): string => (v != null && typeof v === "string" ? v : "");
  const strength =
    raw.strengthAreas ?? data.strengthAreas ?? raw.kekuatan ?? data.kekuatan ?? raw.strengths ?? data.strengths ?? raw.strength;
  const improvement =
    raw.improvementAreas ??
    data.improvementAreas ??
    raw.perlu_ditingkatkan ??
    data.perlu_ditingkatkan ??
    raw.improvements ??
    data.improvements ??
    raw.improvement;
  const rec =
    raw.recommendation ??
    data.recommendation ??
    raw.rekomendasi ??
    data.rekomendasi ??
    raw.recommendationText ??
    data.recommendationText ??
    "";
  const expiresAtVal =
    raw.expiresAt ??
    data.expiresAt ??
    raw.accessExpiresAt ??
    data.accessExpiresAt ??
    raw.subscriptionExpiresAt ??
    data.subscriptionExpiresAt;
  return {
    ...raw,
    summary: (raw.summary as StudentDashboardResponse["summary"]) ?? (data.summary as StudentDashboardResponse["summary"]) ?? {
      totalAttempts: 0,
      avgScore: 0,
      avgPercentile: 0,
    },
    openTryouts: Array.isArray(raw.openTryouts) ? raw.openTryouts : Array.isArray(data.openTryouts) ? data.openTryouts : [],
    recentAttempts:
      Array.isArray(raw.recentAttempts) ? raw.recentAttempts : Array.isArray(data.recentAttempts) ? data.recentAttempts : [],
    strengthAreas: arr(strength),
    improvementAreas: arr(improvement),
    recommendation: typeof rec === "string" ? rec : str(rec),
    expiresAt: typeof expiresAtVal === "string" ? expiresAtVal : undefined,
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

/** Daftar kursus siswa (yang di-enroll). GET /student/courses. */
export async function getStudentCourses(): Promise<Course[]> {
  try {
    const raw = await request<Course[] | { courses?: Course[]; data?: Course[] }>("/student/courses", { method: "GET" });
    if (Array.isArray(raw)) return raw;
    const obj = raw && typeof raw === "object" ? (raw as { courses?: Course[]; data?: Course[] }) : {};
    return Array.isArray(obj.courses) ? obj.courses : Array.isArray(obj.data) ? obj.data : [];
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return [];
    throw e;
  }
}

/** Daftar kelas yang sesuai subject siswa. GET /student/courses/by-subject. */
export async function getStudentCoursesBySubject(): Promise<Course[]> {
  try {
    const raw = await request<Course[] | { courses?: Course[]; data?: Course[] }>("/student/courses/by-subject", {
      method: "GET",
    });
    if (Array.isArray(raw)) return raw;
    const obj = raw && typeof raw === "object" ? (raw as { courses?: Course[]; data?: Course[] }) : {};
    return Array.isArray(obj.courses) ? obj.courses : Array.isArray(obj.data) ? obj.data : [];
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return [];
    throw e;
  }
}

/** Riwayat pembayaran siswa. GET /student/payments. */
export async function getStudentPayments(): Promise<Payment[]> {
  try {
    const raw = await request<Payment[] | { payments?: Payment[]; data?: Payment[] }>("/student/payments", { method: "GET" });
    if (Array.isArray(raw)) return raw;
    const obj = raw && typeof raw === "object" ? (raw as { payments?: Payment[]; data?: Payment[] }) : {};
    return Array.isArray(obj.payments) ? obj.payments : Array.isArray(obj.data) ? obj.data : [];
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
      const arr = Array.isArray(raw) ? raw : (raw as AttemptReviewResponse).items ?? (raw as AttemptReviewResponse).questions ?? [];
      return Array.isArray(arr) ? normalizeAttemptReviewList(arr) : [];
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

// --- Course chat & forum (user ter-enroll) ---
/** GET /courses/:courseId/messages */
export async function getCourseMessages(courseId: string): Promise<CourseMessage[]> {
  try {
    const raw = await request<CourseMessage[] | { messages?: CourseMessage[]; data?: CourseMessage[] }>(
      `/courses/${courseId}/messages`,
      { method: "GET" }
    );
    if (Array.isArray(raw)) return raw;
    const obj = raw && typeof raw === "object" ? (raw as { messages?: CourseMessage[]; data?: CourseMessage[] }) : {};
    return Array.isArray(obj.messages) ? obj.messages : Array.isArray(obj.data) ? obj.data : [];
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return [];
    throw e;
  }
}

/** POST /courses/:courseId/messages — body: { message } */
export async function postCourseMessage(courseId: string, body: { message: string }): Promise<CourseMessage> {
  return request(`/courses/${courseId}/messages`, { method: "POST", body });
}

/** GET /courses/:courseId/discussions */
export async function getCourseDiscussions(courseId: string): Promise<CourseDiscussion[]> {
  try {
    const raw = await request<CourseDiscussion[] | { discussions?: CourseDiscussion[]; data?: CourseDiscussion[] }>(
      `/courses/${courseId}/discussions`,
      { method: "GET" }
    );
    if (Array.isArray(raw)) return raw;
    const obj = raw && typeof raw === "object" ? (raw as { discussions?: CourseDiscussion[]; data?: CourseDiscussion[] }) : {};
    return Array.isArray(obj.discussions) ? obj.discussions : Array.isArray(obj.data) ? obj.data : [];
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return [];
    throw e;
  }
}

/** POST /courses/:courseId/discussions — body: { title, body } */
export async function postCourseDiscussion(courseId: string, body: { title: string; body: string }): Promise<CourseDiscussion> {
  return request(`/courses/${courseId}/discussions`, { method: "POST", body });
}

/** GET /discussions/:id */
export async function getDiscussion(discussionId: string): Promise<CourseDiscussion> {
  return request(`/discussions/${discussionId}`, { method: "GET" });
}

/** GET /discussions/:id/replies */
export async function getDiscussionReplies(discussionId: string): Promise<DiscussionReply[]> {
  try {
    const raw = await request<DiscussionReply[] | { replies?: DiscussionReply[]; data?: DiscussionReply[] }>(
      `/discussions/${discussionId}/replies`,
      { method: "GET" }
    );
    if (Array.isArray(raw)) return raw;
    const obj = raw && typeof raw === "object" ? (raw as { replies?: DiscussionReply[]; data?: DiscussionReply[] }) : {};
    return Array.isArray(obj.replies) ? obj.replies : Array.isArray(obj.data) ? obj.data : [];
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return [];
    throw e;
  }
}

/** POST /discussions/:id/replies — body: { body } */
export async function postDiscussionReply(discussionId: string, body: { body: string }): Promise<DiscussionReply> {
  return request(`/discussions/${discussionId}/replies`, { method: "POST", body });
}

// --- Admin ---
/** GET /admin/overview. Gagal (404/405) = return null. */
export async function getAdminOverview(): Promise<AdminOverviewResponse | null> {
  try {
    const raw = await request<Record<string, unknown>>("/admin/overview", { method: "GET" });
    if (!raw || typeof raw !== "object") return null;
    return {
      totalStudents: Number(raw.totalStudents ?? raw.totalStudent ?? 0),
      activeTryouts: Number(raw.activeTryouts ?? raw.activeTryout ?? 0),
      avgScore: Number(raw.avgScore ?? raw.averageScore ?? 0),
      totalCertificates: Number(raw.totalCertificates ?? raw.totalCertificate ?? 0),
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
    overview?.totalStudents ??
    users.filter((u) => u.role === "student").length;
  // Event aktif: utamakan hitung dari list tryout (status === "open"), fallback ke overview
  const openCount = tryouts.filter((t) => String(t.status).toLowerCase() === "open").length;
  const activeTryouts = tryouts.length > 0 ? openCount : (overview?.activeTryouts ?? 0);
  const avgScore = overview?.avgScore ?? 0;
  const totalCertificates = overview?.totalCertificates ?? 0;

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
    const raw = await request<
      unknown[] | { tryouts?: unknown[]; data?: unknown[] }
    >("/admin/tryouts", { method: "GET" });
    if (Array.isArray(raw)) return raw.map(normalizeToTryoutSession);
    if (raw?.tryouts && Array.isArray(raw.tryouts)) return raw.tryouts.map(normalizeToTryoutSession);
    if (raw?.data && Array.isArray(raw.data)) return raw.data.map(normalizeToTryoutSession);
    return [];
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return [];
    throw e;
  }
}

export async function adminGetTryout(tryoutId: string): Promise<TryoutSession> {
  const raw = await request<unknown>(`/admin/tryouts/${tryoutId}`, { method: "GET" });
  return normalizeToTryoutSession(raw);
}

/** Analisis & grafik per tryout (per soal). GET /admin/tryouts/:tryoutId/analysis */
export async function adminGetTryoutAnalysis(tryoutId: string): Promise<AdminTryoutAnalysis> {
  return request(`/admin/tryouts/${tryoutId}/analysis`, { method: "GET" });
}

function normalizeAdminTryoutStudentItem(item: unknown): AdminTryoutStudent {
  const o = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
  const user = o.user && typeof o.user === "object" ? (o.user as Record<string, unknown>) : null;
  const student = o.student && typeof o.student === "object" ? (o.student as Record<string, unknown>) : null;
  const profile =
    o.profile && typeof o.profile === "object" ? (o.profile as Record<string, unknown>) : null;
  const person = user ?? student ?? profile;
  const name =
    o.name ??
    o.userName ??
    o.studentName ??
    o.fullName ??
    person?.name ??
    person?.userName ??
    person?.studentName ??
    person?.fullName ??
    (o.user && typeof o.user === "string" ? o.user : undefined);
  const email =
    o.email ??
    o.userEmail ??
    o.studentEmail ??
    person?.email ??
    person?.userEmail ??
    person?.studentEmail;
  const attemptObj = o.attempt && typeof o.attempt === "object" ? (o.attempt as Record<string, unknown>) : null;
  /** Sama seperti urutan sebelumnya; nilai non-kosong + trim. `...o` di akhir dulu menimpa ini — sekarang override tetap menang. */
  const attemptIdResolved = (() => {
    const pick = (v: unknown) => {
      if (v == null) return undefined;
      const s = String(v).trim();
      return s === "" ? undefined : s;
    };
    return (
      pick(o.attemptId) ??
      pick(o.latestAttemptId) ??
      pick(o.lastAttemptId) ??
      pick(attemptObj?.id) ??
      pick(attemptObj?.attemptId) ??
      pick(o.id)
    );
  })();
  return {
    ...o,
    id: o.id != null ? String(o.id) : undefined,
    userId:
      o.userId != null
        ? String(o.userId)
        : o.studentId != null
          ? String(o.studentId)
          : person?.id != null
            ? String(person.id)
            : undefined,
    attemptId: attemptIdResolved,
    name: name != null ? String(name) : undefined,
    email: email != null ? String(email) : undefined,
    schoolName:
      o.schoolName != null
        ? String(o.schoolName)
        : o.school != null && typeof o.school === "string"
          ? String(o.school)
          : person?.schoolName != null
            ? String(person.schoolName)
            : person?.school != null && typeof person.school === "string"
              ? String(person.school)
              : undefined,
    score: pickBestScoreValue([
      attemptObj?.score,
      attemptObj?.finalScore,
      attemptObj?.totalScore,
      o.finalScore,
      o.totalScore,
      o.bestScore,
      o.score,
      o.skor,
    ]),
    submittedAt:
      o.submittedAt != null
        ? String(o.submittedAt)
        : o.submitTime != null
          ? String(o.submitTime)
          : attemptObj?.submittedAt != null
            ? String(attemptObj.submittedAt)
            : attemptObj?.submitTime != null
              ? String(attemptObj.submitTime)
              : undefined,
  };
}

function parseTryoutStudentsResponse(raw: unknown): AdminTryoutStudent[] {
  if (Array.isArray(raw)) return raw.map(normalizeAdminTryoutStudentItem);
  const obj = raw && typeof raw === "object" ? (raw as { students?: unknown[]; data?: unknown[] }) : {};
  const nestedData =
    obj.data && typeof obj.data === "object" && !Array.isArray(obj.data)
      ? (obj.data as { students?: unknown[]; items?: unknown[] })
      : null;
  const list = Array.isArray(obj.students)
    ? obj.students
    : Array.isArray(obj.data)
      ? obj.data
      : Array.isArray(nestedData?.students)
        ? nestedData.students
        : Array.isArray(nestedData?.items)
          ? nestedData.items
          : [];
  return list.map(normalizeAdminTryoutStudentItem);
}

/** Daftar siswa yang submit tryout. GET /admin/tryouts/:tryoutId/students */
export async function adminGetTryoutStudents(tryoutId: string): Promise<AdminTryoutStudent[]> {
  try {
    const raw = await request<unknown>(`/admin/tryouts/${tryoutId}/students`, { method: "GET" });
    return parseTryoutStudentsResponse(raw);
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return [];
    throw e;
  }
}

/** Daftar siswa (trainer, tryout sesuai subject). GET /trainer/tryouts/:tryoutId/students */
export async function trainerGetTryoutStudents(tryoutId: string): Promise<AdminTryoutStudent[]> {
  try {
    const raw = await request<unknown>(`/trainer/tryouts/${tryoutId}/students`, { method: "GET" });
    return parseTryoutStudentsResponse(raw);
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return [];
    throw e;
  }
}

/** Tampilan jawaban: backend review bisa kirim userAnswer, answerText, selectedOption, objek, dll. */
function coerceAnswerDisplay(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "string") {
    const t = v.trim();
    return t === "" ? null : t;
  }
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  if (Array.isArray(v)) {
    const parts = v.map((x) => coerceAnswerDisplay(x)).filter((s): s is string => s != null);
    return parts.length > 0 ? parts.join(", ") : null;
  }
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    const nested =
      coerceAnswerDisplay(o.text) ??
      coerceAnswerDisplay(o.value) ??
      coerceAnswerDisplay(o.label) ??
      coerceAnswerDisplay(o.answer) ??
      coerceAnswerDisplay(o.content);
    if (nested != null) return nested;
    try {
      return JSON.stringify(v);
    } catch {
      return null;
    }
  }
  return String(v);
}

function pickUserAnswerFromReviewRow(r: Record<string, unknown>): string | null {
  const keys = [
    "userAnswer",
    "user_answer",
    "answerText",
    "answer_text",
    "studentAnswer",
    "student_answer",
    "submittedAnswer",
    "submitted_answer",
    "selectedOption",
    "selected_option",
    "chosenOption",
    "chosen_option",
    "response",
    "value",
    "content",
    "answer",
  ];
  for (const k of keys) {
    if (r[k] !== undefined && r[k] !== null) {
      const s = coerceAnswerDisplay(r[k]);
      if (s != null) return s;
    }
  }
  return null;
}

function pickCorrectAnswerFromReviewRow(r: Record<string, unknown>): string | null {
  const keys = [
    "correctAnswer",
    "correct_answer",
    "correctText",
    "correct_text",
    "correctOption",
    "correct_option",
    "answerKey",
    "answer_key",
    "expectedAnswer",
    "expected_answer",
    "solution",
    "key",
    "rightAnswer",
    "right_answer",
  ];
  for (const k of keys) {
    if (r[k] !== undefined && r[k] !== null) {
      const s = coerceAnswerDisplay(r[k]);
      if (s != null) return s;
    }
  }
  return null;
}

function pickManualScoreField(raw: Record<string, unknown>): number | null | undefined {
  const v = raw.manualScore ?? raw.manual_score;
  if (v === null) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return undefined;
}

function pickOptionalNumber(raw: Record<string, unknown>, camel: string, snake: string): number | null | undefined {
  const v = raw[camel] ?? raw[snake];
  if (v === null) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return undefined;
}

function normalizeAttemptReviewItem(item: unknown): AttemptReviewItem | null {
  if (!item || typeof item !== "object") return null;
  const r = item as Record<string, unknown>;
  const qid = r.questionId ?? r.question_id;
  if (qid == null || String(qid) === "") return null;
  const manualScore = pickManualScoreField(r);
  const reviewerRaw = r.reviewerComment ?? r.reviewer_comment;
  const userAns = pickUserAnswerFromReviewRow(r);
  const correctAns = pickCorrectAnswerFromReviewRow(r);
  const isCorrectRaw = r.isCorrect ?? r.is_correct;
  const sortRaw = r.sortOrder ?? r.sort_order;
  const img = r.imageUrl ?? r.image_url;
  return {
    questionId: String(qid),
    body: String(r.body ?? r.questionBody ?? ""),
    type: r.type != null ? String(r.type) : undefined,
    options: Array.isArray(r.options)
      ? (r.options as unknown[]).map((x, i) =>
          x && typeof x === "object" && !Array.isArray(x)
            ? String((x as Record<string, unknown>).label ?? (x as Record<string, unknown>).text ?? "")
            : String(x)
        )
      : null,
    correctAnswer: correctAns != null ? String(correctAns) : null,
    userAnswer: userAns != null ? String(userAns) : null,
    isCorrect: typeof isCorrectRaw === "boolean" ? isCorrectRaw : undefined,
    sortOrder: typeof sortRaw === "number" ? sortRaw : undefined,
    imageUrl: img != null ? String(img) : null,
    reviewerComment: reviewerRaw != null ? String(reviewerRaw) : null,
    manualScore,
    autoScore: pickOptionalNumber(r, "autoScore", "auto_score"),
  };
}

function normalizeAttemptReviewList(items: unknown[]): AttemptReviewItem[] {
  return items.map(normalizeAttemptReviewItem).filter((x): x is AttemptReviewItem => x != null);
}

async function fetchTryoutAttemptReview(path: string, attemptIdFallback?: string): Promise<AttemptReviewItem[]> {
  try {
    const raw = await request<AttemptReviewResponse | AttemptReviewItem[]>(path, { method: "GET" });
    const arr = Array.isArray(raw) ? raw : (raw.items ?? raw.questions ?? []);
    return Array.isArray(arr) ? normalizeAttemptReviewList(arr) : [];
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e) && attemptIdFallback) {
      return getAttemptReview(attemptIdFallback);
    }
    if (isNotFoundOrMethodNotAllowed(e)) return [];
    throw e;
  }
}

/** Kisi review satu attempt (semua soal + jawaban siswa). GET .../attempts/:attemptId/review */
export async function adminGetTryoutAttemptReview(
  tryoutId: string,
  attemptId: string
): Promise<AttemptReviewItem[]> {
  const tid = encodeURIComponent(String(tryoutId).trim());
  const aid = encodeURIComponent(String(attemptId).trim());
  return fetchTryoutAttemptReview(`/admin/tryouts/${tid}/attempts/${aid}/review`, attemptId);
}

/** Sama untuk trainer (tryout harus sesuai subjectId user). */
export async function trainerGetTryoutAttemptReview(
  tryoutId: string,
  attemptId: string
): Promise<AttemptReviewItem[]> {
  const tid = encodeURIComponent(String(tryoutId).trim());
  const aid = encodeURIComponent(String(attemptId).trim());
  try {
    return await fetchTryoutAttemptReview(`/trainer/tryouts/${tid}/attempts/${aid}/review`, attemptId);
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) {
      return fetchTryoutAttemptReview(`/guru/tryouts/${tid}/attempts/${aid}/review`, attemptId);
    }
    throw e;
  }
}

export type TryoutAnswerReviewBody = {
  reviewerComment?: string;
  manualScore?: number | null;
};

export type TryoutAnswerReviewBatchItem = {
  questionId: string;
  reviewerComment?: string;
  manualScore?: number | null;
};

export type TryoutAnswerReviewBatchBody = {
  answers: TryoutAnswerReviewBatchItem[];
};

/** Simpan review / skor manual per jawaban. PUT .../answers/:questionId/review (body camelCase). */
export async function adminPutTryoutAttemptAnswerReview(
  tryoutId: string,
  attemptId: string,
  questionId: string,
  body: TryoutAnswerReviewBody
): Promise<AttemptAnswerReviewSaveResponse> {
  const tid = encodeURIComponent(String(tryoutId).trim());
  const aid = encodeURIComponent(String(attemptId).trim());
  const qid = encodeURIComponent(String(questionId).trim());
  return request(`/admin/tryouts/${tid}/attempts/${aid}/answers/${qid}/review`, { method: "PUT", body });
}

export async function trainerPutTryoutAttemptAnswerReview(
  tryoutId: string,
  attemptId: string,
  questionId: string,
  body: TryoutAnswerReviewBody
): Promise<AttemptAnswerReviewSaveResponse> {
  const tid = encodeURIComponent(String(tryoutId).trim());
  const aid = encodeURIComponent(String(attemptId).trim());
  const qid = encodeURIComponent(String(questionId).trim());
  try {
    return await request(`/trainer/tryouts/${tid}/attempts/${aid}/answers/${qid}/review`, {
      method: "PUT",
      body,
    });
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) {
      return request(`/guru/tryouts/${tid}/attempts/${aid}/answers/${qid}/review`, {
        method: "PUT",
        body,
      });
    }
    throw e;
  }
}

/** Simpan review banyak soal sekaligus (1x request). PUT .../attempts/:attemptId/review */
export async function adminPutTryoutAttemptReviewBatch(
  tryoutId: string,
  attemptId: string,
  body: TryoutAnswerReviewBatchBody
): Promise<AttemptAnswerReviewSaveResponse> {
  const tid = encodeURIComponent(String(tryoutId).trim());
  const aid = encodeURIComponent(String(attemptId).trim());
  return request(`/admin/tryouts/${tid}/attempts/${aid}/review`, { method: "PUT", body });
}

export async function trainerPutTryoutAttemptReviewBatch(
  tryoutId: string,
  attemptId: string,
  body: TryoutAnswerReviewBatchBody
): Promise<AttemptAnswerReviewSaveResponse> {
  const tid = encodeURIComponent(String(tryoutId).trim());
  const aid = encodeURIComponent(String(attemptId).trim());
  return request(`/trainer/tryouts/${tid}/attempts/${aid}/review`, { method: "PUT", body });
}

export type TryoutAttemptAutoGradeBody = {
  clearReviewerComments?: boolean;
};

/** Jalankan ulang penilaian otomatis (hapus manual_score pada attempt). POST .../auto-grade */
export async function adminPostTryoutAttemptAutoGrade(
  tryoutId: string,
  attemptId: string,
  body: TryoutAttemptAutoGradeBody = {}
): Promise<unknown> {
  const tid = String(tryoutId).trim();
  const aid = String(attemptId).trim();
  const payload: Record<string, boolean> = {};
  if (body.clearReviewerComments === true) payload.clearReviewerComments = true;
  return request(`/admin/tryouts/${encodeURIComponent(tid)}/attempts/${encodeURIComponent(aid)}/auto-grade`, {
    method: "POST",
    body: payload,
  });
}

/** Auto-grade semua attempt submitted di satu tryout. POST .../auto-grade-submitted */
export async function adminPostTryoutAutoGradeSubmitted(
  tryoutId: string,
  body: TryoutAttemptAutoGradeBody = {}
): Promise<TryoutAutoGradeSubmittedResponse> {
  const tid = String(tryoutId).trim();
  const payload: Record<string, boolean> = {};
  if (body.clearReviewerComments === true) payload.clearReviewerComments = true;
  return request(`/admin/tryouts/${encodeURIComponent(tid)}/auto-grade-submitted`, {
    method: "POST",
    body: payload,
  });
}

export async function trainerPostTryoutAttemptAutoGrade(
  tryoutId: string,
  attemptId: string,
  body: TryoutAttemptAutoGradeBody = {}
): Promise<unknown> {
  const tid = String(tryoutId).trim();
  const aid = String(attemptId).trim();
  const payload: Record<string, boolean> = {};
  if (body.clearReviewerComments === true) payload.clearReviewerComments = true;
  try {
    return await request(
      `/trainer/tryouts/${encodeURIComponent(tid)}/attempts/${encodeURIComponent(aid)}/auto-grade`,
      {
        method: "POST",
        body: payload,
      }
    );
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) {
      return request(`/guru/tryouts/${encodeURIComponent(tid)}/attempts/${encodeURIComponent(aid)}/auto-grade`, {
        method: "POST",
        body: payload,
      });
    }
    throw e;
  }
}

/** Daftar tryout untuk trainer. GET /trainer/tryouts — 404/405 = []. */
export async function trainerListTryouts(): Promise<TryoutSession[]> {
  try {
    const raw = await request<
      unknown[] | { tryouts?: unknown[]; data?: unknown[] }
    >("/trainer/tryouts", { method: "GET" });
    if (Array.isArray(raw)) return raw.map(normalizeToTryoutSession);
    const list = raw?.tryouts ?? raw?.data ?? [];
    return Array.isArray(list) ? list.map(normalizeToTryoutSession) : [];
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return [];
    throw e;
  }
}

/** Detail tryout untuk trainer. GET /trainer/tryouts/:id */
export async function trainerGetTryout(tryoutId: string): Promise<TryoutSession | null> {
  try {
    const raw = await request<unknown>(`/trainer/tryouts/${tryoutId}`, { method: "GET" });
    return normalizeToTryoutSession(raw);
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return null;
    throw e;
  }
}

/** Analisis AI per attempt. GET /admin/tryouts/:tryoutId/attempts/:attemptId/ai-analysis */
export async function adminGetTryoutAttemptAiAnalysis(
  tryoutId: string,
  attemptId: string
): Promise<AdminTryoutAttemptAiAnalysis> {
  return request(`/admin/tryouts/${tryoutId}/attempts/${attemptId}/ai-analysis`, { method: "GET" });
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
  const id = String(item.id ?? item.schoolId ?? "");
  const namaSekolah =
    String(item.namaSekolah ?? item.nama ?? item.name ?? "").trim() || "—";
  return {
    id: id || crypto.randomUUID(),
    namaSekolah,
    npsn: item.npsn != null ? String(item.npsn) : null,
    kabupatenKota:
      item.kabupatenKota != null
        ? String(item.kabupatenKota)
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
  const raw = await request<unknown>("/admin/tryouts", {
    method: "POST",
    body: toTryoutApiPayload(body),
  });
  return normalizeToTryoutSession(raw);
}

export async function adminUpdateTryout(
  tryoutId: string,
  body: Partial<AdminCreateTryoutRequest>
): Promise<Record<string, never>> {
  return request(`/admin/tryouts/${tryoutId}`, {
    method: "PUT",
    body: toTryoutApiPayload(body),
  });
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
      unknown[] | { questions?: unknown[]; data?: unknown[] }
    >(`/admin/tryouts/${tryoutId}/questions`, { method: "GET" });
    let list: unknown[] = [];
    if (Array.isArray(raw)) list = raw;
    else if (raw && typeof raw === "object") {
      const o = raw as { questions?: unknown[]; data?: unknown[] };
      if (Array.isArray(o.questions)) list = o.questions;
      else if (Array.isArray(o.data)) list = o.data;
    }
    return list.map(normalizeQuestion);
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
  const raw = await request<unknown>(
    `/admin/tryouts/${tryoutId}/questions/${questionId}`,
    { method: "GET" }
  );
  return normalizeQuestion(raw);
}

export async function adminCreateQuestion(
  tryoutId: string,
  body: AdminCreateQuestionRequest
): Promise<Question> {
  const raw = await request<unknown>(`/admin/tryouts/${tryoutId}/questions`, {
    method: "POST",
    body,
  });
  return normalizeQuestion(raw);
}

/** Update question (PUT /admin/tryouts/{tryoutId}/questions/{questionId}). */
export async function adminUpdateQuestion(
  tryoutId: string,
  questionId: string,
  body: AdminUpdateQuestionRequest
): Promise<Question> {
  const raw = await request<unknown>(
    `/admin/tryouts/${tryoutId}/questions/${questionId}`,
    { method: "PUT", body }
  );
  return normalizeQuestion(raw);
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

/** Statistik soal (jumlah mengerjakan, % benar/salah). 404/405 = null. */
export async function adminGetQuestionStats(
  tryoutId: string,
  questionId: string
): Promise<QuestionStats | null> {
  try {
    const raw = await request<Record<string, unknown>>(
      `/admin/tryouts/${tryoutId}/questions/${questionId}/stats`,
      { method: "GET" }
    );
    if (!raw || typeof raw !== "object") return null;
    return {
      participantsCount: typeof raw.participantsCount === "number" ? raw.participantsCount : undefined,
      answeredCount: typeof raw.answeredCount === "number" ? raw.answeredCount : undefined,
      correctCount: typeof raw.correctCount === "number" ? raw.correctCount : undefined,
      wrongCount: typeof raw.wrongCount === "number" ? raw.wrongCount : undefined,
      correctPercent: typeof raw.correctPercent === "number" ? raw.correctPercent : undefined,
      wrongPercent: typeof raw.wrongPercent === "number" ? raw.wrongPercent : undefined,
    };
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return null;
    throw e;
  }
}

/** Statistik semua soal tryout sekaligus (bulk). GET /admin/tryouts/:tryoutId/questions/stats. 404/405 = null. */
export async function adminGetAllQuestionStats(
  tryoutId: string
): Promise<TryoutQuestionStatsBulkResponse | null> {
  try {
    const raw = await request<Record<string, unknown>>(
      `/admin/tryouts/${tryoutId}/questions/stats`,
      { method: "GET" }
    );
    if (!raw || typeof raw !== "object") return null;
    const questions = Array.isArray(raw.questions) ? raw.questions : [];
    const items = questions.map((q: Record<string, unknown>) => ({
      questionId: String(q.questionId ?? ""),
      answeredCount: typeof q.answeredCount === "number" ? q.answeredCount : undefined,
      correctCount: typeof q.correctCount === "number" ? q.correctCount : undefined,
      wrongCount: typeof q.wrongCount === "number" ? q.wrongCount : undefined,
      correctPercent: typeof q.correctPercent === "number" ? q.correctPercent : undefined,
      wrongPercent: typeof q.wrongPercent === "number" ? q.wrongPercent : undefined,
    }));
    return {
      participantsCount: typeof raw.participantsCount === "number" ? raw.participantsCount : undefined,
      questions: items,
    };
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return null;
    throw e;
  }
}

export async function adminCreateCourse(
  body: AdminCreateCourseRequest
): Promise<Course> {
  return request("/admin/courses", { method: "POST", body });
}

/** List courses. GET /admin/courses. 404/405 = []. */
export async function adminListCourses(): Promise<Course[]> {
  try {
    const raw = await request<Course[] | { courses?: Course[]; data?: Course[] }>("/admin/courses", { method: "GET" });
    if (Array.isArray(raw)) return raw;
    if (raw?.courses && Array.isArray(raw.courses)) return raw.courses;
    if (raw?.data && Array.isArray(raw.data)) return raw.data;
    return [];
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return [];
    throw e;
  }
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
  body: { title: string; description?: string | null; sortOrder?: number }
): Promise<Course> {
  return request(`/admin/subjects/${subjectId}/courses`, {
    method: "POST",
    body: { ...body, subjectId },
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
