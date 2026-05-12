/**
 * API client for FansEdu LMS v1 (Go backend).
 * Set NEXT_PUBLIC_API_URL in .env (e.g. http://localhost:8080).
 */

import type {
  AdminCourseLinkedTryoutsRequest,
  AdminCourseManageResponse,
  AdminGrantEnrollmentRequest,
  AdminCreateCourseRequest,
  AdminCreateLevelRequest,
  AdminManualOrderCreateRequest,
  AdminOrder,
  AdminOrderPurchaseMetaPatchRequest,
  AdminUpdateEnrollmentRequest,
  AdminVerifyOrderRequest,
  AdminCreateQuestionRequest,
  AdminUpdateQuestionRequest,
  AdminCreateSettingRequest,
  AdminCreateSubjectRequest,
  AdminCreateTryoutRequest,
  AdminCreateUserRequest,
  AdminIssueCertificateRequest,
  AdminOverviewResponse,
  AdminSetting,
  AdminTryoutAnalysis,
  AdminTryoutAttemptAiAnalysis,
  AdminTryoutStudent,
  AdminUpdateLevelRequest,
  AdminUpdateSettingRequest,
  AdminUpdateUserRequest,
  AuthMeResponse,
  Attempt,
  AttemptAnswerReviewSaveResponse,
  AttemptReviewItem,
  AttemptReviewResponse,
  Certificate,
  Course,
  CourseEnrollment,
  CourseMeeting,
  CourseProgramPayload,
  CoursePublicationStatus,
  CourseTrackType,
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
  AdminCreatePaymentRequest,
  AdminCreateVoucherRequest,
  AdminUpdatePaymentRequest,
  AdminUpdateVoucherRequest,
  AdminVoucher,
  CheckoutPaymentSessionRequest,
  CheckoutPaymentSessionResponse,
  StudentVoucherClaim,
  AiAnalysisResponse,
  AiQuestionItem,
  CreateSubscriptionRequest,
  GenerateQuestionsRequest,
  QuestionsQuery,
  RankingEntry,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
  Subscription,
  SetPasswordRequest,
  AdminAddCourseContentRequest,
  AdminCourseContent,
  AdminUpdateCourseContentRequest,
  AdminUploadCourseMaterialResponse,
} from "./api-types";
import { deepToCamelCase } from "./json-case";
import { normalizeUserRoleFromApi } from "./user-role";

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

/**
 * Konversi path relatif backend (mis. /uploads/...) menjadi URL absolut.
 * Diperlukan karena proofUrl dari backend adalah path relatif, bukan URL lengkap.
 */
export function resolveBackendUrl(path: string): string {
  if (!path || path.startsWith("http://") || path.startsWith("https://")) return path;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const base = apiUrl
    ? apiUrl.replace(/\/$/, "")
    : typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:8080";
  return base + (path.startsWith("/") ? path : "/" + path);
}

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
    const d = data as {
      error?: string | { code?: string; message?: string };
      message?: string;
    };
    const nestedErrorMessage =
      d?.error && typeof d.error === "object" ? d.error.message : undefined;
    const directErrorMessage =
      typeof d?.error === "string" ? d.error : undefined;
    let message =
      nestedErrorMessage ?? directErrorMessage ?? d?.message ?? res.statusText;
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

async function requestFormData<T>(
  path: string,
  formData: FormData,
  overrides?: { baseUrl?: string }
): Promise<T> {
  const base = overrides?.baseUrl ?? BASE;
  const url = `${base}${path}`;
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: formData,
  });
  if (res.status === 204) return undefined as T;
  const rawData = await res.json().catch(() => ({}));
  const data = deepToCamelCase(rawData);
  if (!res.ok) {
    if (res.status === 401) {
      scheduleUnauthorizedRedirect();
    }
    const d = data as {
      error?: string | { message?: string };
      message?: string;
    };
    const nestedErrorMessage = d?.error && typeof d.error === "object" ? d.error.message : undefined;
    const directErrorMessage = typeof d?.error === "string" ? d.error : undefined;
    const err = new Error(nestedErrorMessage ?? directErrorMessage ?? d?.message ?? res.statusText);
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
    gradingMode:
      obj.gradingMode === "manual" || obj.gradingMode === "auto"
        ? obj.gradingMode
        : undefined,
    eventCategory:
      obj.eventCategory != null ? String(obj.eventCategory) : null,
    levelId: obj.levelId != null ? String(obj.levelId) : null,
    levelName: obj.levelName != null ? String(obj.levelName) : obj.schoolLevel != null ? String(obj.schoolLevel) : null,
    subjectId: obj.subjectId != null ? String(obj.subjectId) : null,
    subjectName: obj.subjectName != null ? String(obj.subjectName) : obj.subject != null ? String(obj.subject) : null,
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
  const co = obj.correctOption;
  const ct = obj.correctText;
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

function normalizeUserRoleFromMe(raw: unknown): UserRole {
  const s = raw != null ? String(raw).toLowerCase() : "";
  if (s === "admin") return "admin";
  if (s === "trainer" || s === "guru" || s === "teacher") return "trainer";
  return "student";
}

/** GET /auth/me — profil dari JWT. */
export async function getAuthMe(): Promise<AuthMeResponse> {
  const raw = await request<Record<string, unknown>>("/auth/me", { method: "GET" });
  const inner =
    raw.user && typeof raw.user === "object" && !Array.isArray(raw.user)
      ? (raw.user as Record<string, unknown>)
      : raw;
  const id = inner.id != null ? String(inner.id) : "";
  if (!id) {
    throw new Error("Respons profil tidak valid.");
  }
  const name =
    String(inner.name ?? inner.displayName ?? inner.fullName ?? "").trim() ||
    String(inner.email ?? "");
  const email = String(inner.email ?? "");
  const role = normalizeUserRoleFromMe(inner.role ?? inner.roleCode ?? raw.role);
  return {
    id,
    name,
    email,
    role,
    avatarUrl: inner.avatarUrl != null ? String(inner.avatarUrl) : null,
    subjectId: inner.subjectId != null ? String(inner.subjectId) : null,
    schoolId: inner.schoolId != null ? String(inner.schoolId) : null,
    subjectName: inner.subjectName != null ? String(inner.subjectName) : null,
    schoolName: inner.schoolName != null ? String(inner.schoolName) : null,
    mustSetPassword:
      raw.mustSetPassword === true ||
      inner.mustSetPassword === true,
    nextAction:
      raw.nextAction != null
        ? String(raw.nextAction)
        : inner.nextAction != null
          ? String(inner.nextAction)
          : null,
    roleCode: inner.roleCode != null ? String(inner.roleCode) : null,
  };
}

/** Set password pertama kali. POST /auth/set-password. */
export async function authSetPassword(body: SetPasswordRequest): Promise<void> {
  await request("/auth/set-password", { method: "POST", body });
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
function unwrapPaymentResponse(raw: unknown): Payment {
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (typeof obj.id === "string") return raw as Payment;
    if (obj.data && typeof obj.data === "object" && typeof (obj.data as { id?: unknown }).id === "string") {
      return obj.data as Payment;
    }
  }
  throw new Error("Respons pembayaran tidak valid");
}

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

function unwrapSinglePaymentFromGet(raw: unknown): Payment | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id === "string") return o as Payment;
  const data = o.data;
  if (data && typeof data === "object" && typeof (data as { id?: unknown }).id === "string") {
    return data as Payment;
  }
  const payment = o.payment;
  if (payment && typeof payment === "object" && typeof (payment as { id?: unknown }).id === "string") {
    return payment as Payment;
  }
  return null;
}

/**
 * Satu pembayaran admin. GET /admin/payments/:id
 * Jika route tidak ada (404/405), kembalikan null — pemanggil bisa fallback ke adminListPayments.
 */
export async function adminGetPayment(paymentId: string): Promise<Payment | null> {
  const id = encodeURIComponent(paymentId.trim());
  if (!id) return null;
  try {
    const raw = await request<unknown>(`/admin/payments/${id}`, { method: "GET" });
    return unwrapSinglePaymentFromGet(raw);
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return null;
    throw e;
  }
}

/** POST /admin/payments/:id/confirm — konfirmasi pembayaran (admin). */
export async function adminConfirmPayment(paymentId: string): Promise<Payment> {
  try {
    return await request(`/admin/payments/${paymentId}/confirm`, { method: "POST" });
  } catch (e) {
    const status = (e as { status?: number })?.status;
    if (status !== 404 && status !== 405) throw e;
    // Fallback endpoint: PUT /admin/payments/:id { status: "paid" }
    return request(`/admin/payments/${paymentId}`, {
      method: "PUT",
      body: { status: "paid" },
    });
  }
}

/** POST /admin/payments/:id/reject — tolak pembayaran (admin). */
export async function adminRejectPayment(paymentId: string, body?: { reason?: string }): Promise<Payment> {
  try {
    return await request(`/admin/payments/${paymentId}/reject`, { method: "POST", body: body ?? {} });
  } catch (e) {
    const status = (e as { status?: number })?.status;
    if (status !== 404 && status !== 405) throw e;
    // Fallback endpoint: PUT /admin/payments/:id { status: "rejected", reason }
    return request(`/admin/payments/${paymentId}`, {
      method: "PUT",
      body: { status: "rejected", reason: body?.reason ?? null },
    });
  }
}

/** Admin mencatat pembayaran atas nama user (mis. siswa + kelas). */
export async function adminCreatePayment(body: AdminCreatePaymentRequest): Promise<Payment> {
  const raw = await request<unknown>("/admin/payments", { method: "POST", body });
  return unwrapPaymentResponse(raw);
}

/** Admin memperbarui tanggal pembelian atau catatan. */
export async function adminUpdatePayment(
  paymentId: string,
  body: AdminUpdatePaymentRequest
): Promise<Payment> {
  const id = encodeURIComponent(paymentId.trim());
  const raw = await request<unknown>(`/admin/payments/${id}`, { method: "PATCH", body });
  return unwrapPaymentResponse(raw);
}

/** Sesi pembayaran Snap Midtrans untuk order/checkout. POST /checkout/payment-session */
export async function checkoutCreatePaymentSession(
  body: CheckoutPaymentSessionRequest
): Promise<CheckoutPaymentSessionResponse> {
  const raw = await request<unknown>("/checkout/payment-session", { method: "POST", body });
  const u = unwrapApiData<Record<string, unknown>>(raw);
  if (u && typeof u === "object") return u as CheckoutPaymentSessionResponse;
  if (raw && typeof raw === "object") return raw as CheckoutPaymentSessionResponse;
  return {};
}

/** Buat order manual (pending) untuk user + item kelas. */
export async function adminCreateManualOrder(
  body: AdminManualOrderCreateRequest
): Promise<AdminOrder> {
  const raw = await request<unknown>("/admin/orders/manual", { method: "POST", body });
  const obj = unwrapApiData<Record<string, unknown>>(raw);
  if (obj && typeof obj.id === "string") return obj as AdminOrder;
  if (raw && typeof raw === "object" && typeof (raw as { id?: unknown }).id === "string") {
    return raw as AdminOrder;
  }
  throw new Error("Respons order manual tidak valid");
}

/** Upload bukti pembayaran untuk order manual/admin. */
export async function adminUploadOrderPaymentProof(
  orderId: string,
  proofFile: File,
  body?: { senderAccountNo?: string; senderName?: string }
): Promise<Record<string, unknown>> {
  const id = encodeURIComponent(orderId.trim());
  const fd = new FormData();
  fd.append("proof", proofFile);
  if (body?.senderAccountNo) fd.append("senderAccountNo", body.senderAccountNo);
  if (body?.senderName) fd.append("senderName", body.senderName);
  return requestFormData(`/admin/orders/${id}/payment-proof`, fd);
}

/** Verifikasi order (bayar + enroll), opsional purchasedAt (RFC3339). */
export async function adminVerifyOrder(
  orderId: string,
  body?: AdminVerifyOrderRequest
): Promise<Record<string, unknown>> {
  const id = encodeURIComponent(orderId.trim());
  return request(`/admin/orders/${id}/verify`, { method: "PUT", body: body ?? {} });
}

/** Update purchasedAt/paymentProofAt order tanpa verify ulang. */
export async function adminPatchOrderPurchaseMeta(
  orderId: string,
  body: AdminOrderPurchaseMetaPatchRequest
): Promise<Record<string, unknown>> {
  const id = encodeURIComponent(orderId.trim());
  return request(`/admin/orders/${id}/purchase-meta`, { method: "PATCH", body });
}

/** Ambil detail order admin. GET /admin/orders/:id. 404/405 = null. */
export async function adminGetOrderDetail(
  orderId: string
): Promise<Record<string, unknown> | null> {
  const id = encodeURIComponent(orderId.trim());
  try {
    return await request<Record<string, unknown>>(`/admin/orders/${id}`, { method: "GET" });
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return null;
    throw e;
  }
}

/** Beri akses kelas ke user tanpa order. */
export async function adminGrantEnrollment(
  body: AdminGrantEnrollmentRequest
): Promise<CourseEnrollment> {
  return request("/admin/enrollments/grant", { method: "POST", body });
}

/** Ubah tanggal enrolled_at enrollment. */
export async function adminUpdateEnrollment(
  enrollmentId: string,
  body: AdminUpdateEnrollmentRequest
): Promise<CourseEnrollment> {
  const id = encodeURIComponent(enrollmentId.trim());
  return request(`/admin/enrollments/${id}`, { method: "PATCH", body });
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
    const pickBool = (
      ...vals: unknown[]
    ): boolean | undefined => {
      for (const v of vals) {
        if (typeof v === "boolean") return v;
      }
      return undefined;
    };
    const emailPembayaran = pickBool(
      data.emailPembayaran,
      raw.emailPembayaran,
      data.email_pembayaran,
      data.notificationEmailPembayaran
    );
    const emailPengingat = pickBool(
      data.emailPengingat,
      raw.emailPengingat,
      data.email_pengingat,
      data.notificationEmailPengingat
    );
    const notifAktivitasSiswa = pickBool(
      data.notifAktivitasSiswa,
      raw.notifAktivitasSiswa,
      data.notif_aktivitas_siswa,
      data.notificationAktivitasSiswa
    );

    return {
      name,
      email,
      school,
      ...(emailPembayaran !== undefined ? { emailPembayaran } : {}),
      ...(emailPengingat !== undefined ? { emailPengingat } : {}),
      ...(notifAktivitasSiswa !== undefined ? { notifAktivitasSiswa } : {}),
    };
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
    const raw = await request<unknown>("/tryouts/open", { method: "GET", auth: false });
    const list: unknown[] = Array.isArray(raw)
      ? raw
      : raw && typeof raw === "object"
        ? Array.isArray((raw as { tryouts?: unknown[] }).tryouts)
          ? (raw as { tryouts: unknown[] }).tryouts
          : Array.isArray((raw as { data?: unknown[] }).data)
            ? (raw as { data: unknown[] }).data
            : []
        : [];
    return list.map(normalizeToTryoutSession);
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return [];
    throw e;
  }
}

/** Semua tryout (untuk siswa: tampil semua, pisah sudah selesai / akan datang). 404 = daftar kosong. */
export async function listAllTryouts(): Promise<TryoutSession[]> {
  try {
    const raw = await request<unknown>("/tryouts", { method: "GET", auth: false });
    const list: unknown[] = Array.isArray(raw)
      ? raw
      : raw && typeof raw === "object"
        ? Array.isArray((raw as { tryouts?: unknown[] }).tryouts)
          ? (raw as { tryouts: unknown[] }).tryouts
          : Array.isArray((raw as { data?: unknown[] }).data)
            ? (raw as { data: unknown[] }).data
            : []
        : [];
    return list.map(normalizeToTryoutSession);
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return [];
    throw e;
  }
}

/**
 * Leaderboard tryout untuk admin (Bearer). Fallback ke GET publik `/tryouts/:id/leaderboard`
 * jika endpoint admin belum ada — agar userId/attemptId selaras dengan data peserta.
 */
export async function adminGetTryoutLeaderboard(tryoutId: string): Promise<LeaderboardEntry[]> {
  const tid = encodeURIComponent(String(tryoutId).trim());
  try {
    const raw = await request<LeaderboardEntry[] | { leaderboard?: LeaderboardEntry[]; data?: LeaderboardEntry[] }>(
      `/admin/tryouts/${tid}/leaderboard`,
      { method: "GET" }
    );
    const list = Array.isArray(raw)
      ? raw
      : (raw as { leaderboard?: LeaderboardEntry[] })?.leaderboard ??
        (raw as { data?: LeaderboardEntry[] })?.data ??
        [];
    return normalizeLeaderboard(list as unknown[]);
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return getTryoutLeaderboard(tryoutId);
    throw e;
  }
}

export async function getTryout(tryoutId: string): Promise<TryoutSession> {
  const raw = await request<unknown>(`/tryouts/${tryoutId}`, { method: "GET", auth: false });
  return normalizeToTryoutSession(raw);
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
    const nestedUser =
      o.user && typeof o.user === "object" && !Array.isArray(o.user)
        ? (o.user as Record<string, unknown>)
        : null;
    const userIdResolved = (() => {
      const pick = (v: unknown) => {
        if (v == null) return undefined;
        const s = String(v).trim();
        return s === "" ? undefined : s;
      };
      return (
        pick(o.userId) ??
        pick(o.studentId) ??
        pick(o.studentUserId) ??
        pick(o.user_id) ??
        pick(nestedUser?.id) ??
        pick(nestedUser?.userId)
      );
    })();
    const attemptIdResolved = (() => {
      const pick = (v: unknown) => {
        if (v == null) return undefined;
        const s = String(v).trim();
        return s === "" ? undefined : s;
      };
      const nestedAttempt =
        o.attempt && typeof o.attempt === "object" && !Array.isArray(o.attempt)
          ? (o.attempt as Record<string, unknown>)
          : null;
      return (
        pick(o.attemptId) ??
        pick(o.latestAttemptId) ??
        pick(o.lastAttemptId) ??
        pick(nestedAttempt?.id) ??
        pick(nestedAttempt?.attemptId)
      );
    })();
    /** Spread dulu baru field dinormalisasi agar `...o` tidak menimpa score dengan 0 dari API. */
    return {
      ...o,
      rank: Number(o.rank ?? o.urutan ?? index + 1),
      userId: userIdResolved,
      studentId: o.studentId != null ? String(o.studentId) : userIdResolved,
      attemptId: attemptIdResolved,
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
    raw.perluDitingkatkan ??
    data.perluDitingkatkan ??
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
    const raw = await request<unknown>("/student/tryouts", { method: "GET" });
    const list: unknown[] = Array.isArray(raw)
      ? raw
      : raw && typeof raw === "object"
        ? Array.isArray((raw as { tryouts?: unknown[] }).tryouts)
          ? (raw as { tryouts: unknown[] }).tryouts
          : Array.isArray((raw as { data?: unknown[] }).data)
            ? (raw as { data: unknown[] }).data
            : []
        : [];
    return list.map(normalizeToTryoutSession);
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

function normalizeAdminSettingRow(row: unknown): AdminSetting | null {
  if (!row || typeof row !== "object") return null;
  const o = row as Record<string, unknown>;
  const id = o.id != null ? String(o.id) : "";
  if (!id) return null;
  return {
    id,
    key: String(o.key ?? ""),
    slug: o.slug != null ? String(o.slug) : null,
    value: o.value != null ? String(o.value) : "",
    description: o.description != null ? String(o.description) : null,
    createdAt: o.createdAt != null ? String(o.createdAt) : null,
    updatedAt: o.updatedAt != null ? String(o.updatedAt) : null,
  };
}

function extractAdminSettingsFromResponse(raw: unknown): AdminSetting[] {
  if (Array.isArray(raw)) {
    return raw.map(normalizeAdminSettingRow).filter((x): x is AdminSetting => x != null);
  }
  if (raw && typeof raw === "object") {
    const r = raw as Record<string, unknown>;
    for (const k of ["settings", "data", "items"]) {
      const v = r[k];
      if (Array.isArray(v)) {
        return v.map(normalizeAdminSettingRow).filter((x): x is AdminSetting => x != null);
      }
    }
  }
  return [];
}

function unwrapAdminSettingMutationResponse(raw: unknown): AdminSetting {
  const one = normalizeAdminSettingRow(raw);
  if (one) return one;
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const nested = o.data ?? o.setting;
    const n = normalizeAdminSettingRow(nested);
    if (n) return n;
  }
  throw new Error("Respons setting tidak valid");
}

/** GET /admin/settings/env-keys — daftar key env yang boleh diisi lewat settings. */
export async function adminListSettingsEnvKeys(): Promise<string[]> {
  try {
    const raw = await request<unknown>("/admin/settings/env-keys", { method: "GET" });
    if (Array.isArray(raw)) return raw.map((x) => String(x));
    if (raw && typeof raw === "object") {
      const o = raw as Record<string, unknown>;
      const keys = o.keys ?? o.envKeys ?? o.data;
      if (Array.isArray(keys)) return keys.map((x) => String(x));
    }
    return [];
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return [];
    throw e;
  }
}

/** GET /admin/settings — semua settings. */
export async function adminListSettings(): Promise<AdminSetting[]> {
  try {
    const raw = await request<unknown>("/admin/settings", { method: "GET" });
    return extractAdminSettingsFromResponse(raw);
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return [];
    throw e;
  }
}

/** GET /admin/settings/:id — detail (nilai sensitif utuh). */
export async function adminGetSetting(settingId: string): Promise<AdminSetting | null> {
  const id = encodeURIComponent(settingId.trim());
  try {
    const raw = await request<unknown>(`/admin/settings/${id}`, { method: "GET" });
    const one = normalizeAdminSettingRow(raw);
    if (one) return one;
    if (raw && typeof raw === "object") {
      const o = raw as Record<string, unknown>;
      const nested = o.data ?? o.setting;
      return normalizeAdminSettingRow(nested);
    }
    return null;
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return null;
    throw e;
  }
}

/** POST /admin/settings */
export async function adminCreateSetting(body: AdminCreateSettingRequest): Promise<AdminSetting> {
  const raw = await request<unknown>("/admin/settings", { method: "POST", body });
  return unwrapAdminSettingMutationResponse(raw);
}

/** PUT /admin/settings/:id */
export async function adminUpdateSetting(
  settingId: string,
  body: AdminUpdateSettingRequest
): Promise<AdminSetting> {
  const id = encodeURIComponent(settingId.trim());
  const raw = await request<unknown>(`/admin/settings/${id}`, { method: "PUT", body });
  return unwrapAdminSettingMutationResponse(raw);
}

/** DELETE /admin/settings/:id */
export async function adminDeleteSetting(settingId: string): Promise<void> {
  const id = encodeURIComponent(settingId.trim());
  await request(`/admin/settings/${id}`, { method: "DELETE" });
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
    "answerText",
    "studentAnswer",
    "submittedAnswer",
    "selectedOption",
    "chosenOption",
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
    "correctText",
    "correctOption",
    "answerKey",
    "expectedAnswer",
    "solution",
    "key",
    "rightAnswer",
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
  const v = raw.manualScore;
  if (v === null) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return undefined;
}

function pickOptionalNumber(raw: Record<string, unknown>, camel: string): number | null | undefined {
  const v = raw[camel];
  if (v === null) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return undefined;
}

function normalizeAttemptReviewItem(item: unknown): AttemptReviewItem | null {
  if (!item || typeof item !== "object") return null;
  const r = item as Record<string, unknown>;
  const nestedQ =
    r.question && typeof r.question === "object" && !Array.isArray(r.question)
      ? (r.question as Record<string, unknown>)
      : null;
  const qidRaw = r.questionId ?? nestedQ?.id;
  if (qidRaw == null || String(qidRaw).trim() === "") return null;
  const reviewerRaw = r.reviewerComment;
  const userAns = pickUserAnswerFromReviewRow(r);
  const correctAns = pickCorrectAnswerFromReviewRow(r);
  const isCorrectRaw = r.isCorrect;
  const sortRaw = r.sortOrder;
  const img = r.imageUrl;
  const autoScore =
    pickOptionalNumber(r, "autoScore") ?? pickOptionalNumber(r, "scoreGot");
  const maxScoreRaw =
    pickOptionalNumber(r, "maxScore") ??
    pickOptionalNumber(r, "questionMaxScore") ??
    (nestedQ != null ? pickOptionalNumber(nestedQ, "maxScore") : undefined);
  const maxScore =
    maxScoreRaw !== undefined && Number.isFinite(maxScoreRaw) && maxScoreRaw > 0 ? maxScoreRaw : undefined;

  const selectedOptRaw = r.selectedOption != null ? String(r.selectedOption).trim() : "";
  const correctOptRaw = r.correctOption != null ? String(r.correctOption).trim() : "";
  const selectedOption = selectedOptRaw !== "" ? selectedOptRaw : null;
  const correctOption = correctOptRaw !== "" ? correctOptRaw : null;
  const optionsMatchMcq =
    selectedOption != null &&
    correctOption != null &&
    selectedOption.toUpperCase() === correctOption.toUpperCase();
  const fullCreditFromMatching =
    optionsMatchMcq ||
    isCorrectRaw === true ||
    (typeof r.autoIsCorrect === "boolean" && r.autoIsCorrect === true);

  let manualScore = pickManualScoreField(r);
  if (fullCreditFromMatching && manualScore == null && autoScore != null && Number.isFinite(autoScore)) {
    manualScore = autoScore;
  }

  return {
    questionId: String(qidRaw).trim(),
    body: String(r.body ?? r.questionBody ?? nestedQ?.body ?? ""),
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
    autoScore,
    maxScore: maxScore ?? null,
    selectedOption,
    correctOption,
  };
}

function normalizeAttemptReviewList(items: unknown[]): AttemptReviewItem[] {
  return items.map(normalizeAttemptReviewItem).filter((x): x is AttemptReviewItem => x != null);
}

function parseAttemptReviewResponseBody(raw: unknown): AttemptReviewItem[] {
  if (Array.isArray(raw)) return normalizeAttemptReviewList(raw);
  if (raw && typeof raw === "object") {
    const o = raw as AttemptReviewResponse;
    const arr = o.items ?? o.questions ?? [];
    return Array.isArray(arr) ? normalizeAttemptReviewList(arr) : [];
  }
  return [];
}

async function fetchTryoutAttemptReview(path: string, attemptIdFallback?: string): Promise<AttemptReviewItem[]> {
  try {
    const raw = await request<AttemptReviewResponse | AttemptReviewItem[]>(path, { method: "GET" });
    return parseAttemptReviewResponseBody(raw);
  } catch (e) {
    const status = (e as Error & { status?: number }).status;
    /** Backend baru: POST `{}` sama dengan GET untuk memuat review. */
    if (status === 405) {
      try {
        const raw = await request<AttemptReviewResponse | AttemptReviewItem[]>(path, {
          method: "POST",
          body: {},
        });
        return parseAttemptReviewResponseBody(raw);
      } catch (e2) {
        if (isNotFoundOrMethodNotAllowed(e2) && attemptIdFallback) {
          return getAttemptReview(attemptIdFallback);
        }
        if (isNotFoundOrMethodNotAllowed(e2)) return [];
        throw e2;
      }
    }
    if (isNotFoundOrMethodNotAllowed(e) && attemptIdFallback) {
      return getAttemptReview(attemptIdFallback);
    }
    if (isNotFoundOrMethodNotAllowed(e)) return [];
    throw e;
  }
}

/** Kisi review satu attempt (semua soal + jawaban siswa). GET …/review; jika 405, POST `{}` (kontrak BE terbaru). */
export async function adminGetTryoutAttemptReview(
  tryoutId: string,
  attemptId: string
): Promise<AttemptReviewItem[]> {
  const tid = encodeURIComponent(String(tryoutId).trim());
  const aid = encodeURIComponent(String(attemptId).trim());
  return fetchTryoutAttemptReview(`/admin/tryouts/${tid}/attempts/${aid}/review`, attemptId);
}

/**
 * Muat review attempt dengan POST `{}` — setara GET di backend terbaru.
 * Berguna jika proxy/middleware hanya mengizinkan POST.
 */
export async function adminPostTryoutAttemptReview(
  tryoutId: string,
  attemptId: string
): Promise<AttemptReviewItem[]> {
  const tid = encodeURIComponent(String(tryoutId).trim());
  const aid = encodeURIComponent(String(attemptId).trim());
  const raw = await request<AttemptReviewResponse | AttemptReviewItem[]>(
    `/admin/tryouts/${tid}/attempts/${aid}/review`,
    { method: "POST", body: {} }
  );
  return parseAttemptReviewResponseBody(raw);
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

/** Simpan review banyak soal sekaligus. PUT …/attempts/:attemptId/review + body `{ answers }`.
 * Jika backend mengembalikan 405/501, UI (`TryoutAttemptReviewModal`) fallback ke PUT per `questionId`. */
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

/** Jalankan ulang penilaian otomatis (hapus manualScore pada attempt). POST .../auto-grade */
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
  const raw = await request<unknown>("/admin/courses", { method: "POST", body });
  const obj = unwrapApiData<Record<string, unknown>>(raw) ?? (raw as Record<string, unknown>);
  return normalizeAdminCourseItem(obj);
}

function normalizeAdminCourseItem(item: unknown): Course {
  const o = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
  const tt = o.trackType;
  const trackType: CourseTrackType | undefined =
    tt === "tryout" ? "tryout" : tt === "meetings" ? "meetings" : undefined;
  const st = o.status ?? o.courseStatus ?? o.publicationStatus;
  const status: CoursePublicationStatus | null =
    st != null && String(st).trim() !== "" ? String(st) : null;
  return {
    id: String(o.id ?? ""),
    title: String(o.title ?? ""),
    description: o.description != null ? String(o.description) : null,
    createdBy: o.createdBy != null ? String(o.createdBy) : null,
    subjectId: o.subjectId != null ? String(o.subjectId) : null,
    sortOrder: typeof o.sortOrder === "number" ? o.sortOrder : null,
    trackType,
    status,
  };
}

function normalizeAdminCourseList(items: unknown[]): Course[] {
  if (!Array.isArray(items)) return [];
  return items.map(normalizeAdminCourseItem).filter((c) => c.id.length > 0);
}

/** True jika kelas boleh ditawarkan sebagai linked course (hanya yang sudah publish). */
export function isCoursePublishedForLinking(c: Pick<Course, "status">): boolean {
  const s = String(c.status ?? "").toLowerCase().trim();
  return s === "published" || s === "active";
}

/** List courses. GET /admin/courses. 404/405 = []. */
export async function adminListCourses(): Promise<Course[]> {
  try {
    const raw = await request<Course[] | { courses?: Course[]; data?: Course[] }>("/admin/courses", { method: "GET" });
    let list: unknown[] = [];
    if (Array.isArray(raw)) list = raw as unknown[];
    else if (raw?.courses && Array.isArray(raw.courses)) list = raw.courses as unknown[];
    else if (raw?.data && Array.isArray(raw.data)) list = raw.data as unknown[];
    return normalizeAdminCourseList(list);
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
async function requestInternalAdmin(path: string): Promise<unknown> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(path, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (res.status === 204) return undefined;
  const raw = await res.json().catch(() => ({}));
  const data = deepToCamelCase(raw);
  if (!res.ok) {
    const d = data as {
      error?: string | { code?: string; message?: string };
      message?: string;
    };
    const nestedErrorMessage =
      d?.error && typeof d.error === "object" ? d.error.message : undefined;
    const directErrorMessage = typeof d?.error === "string" ? d.error : undefined;
    const message = nestedErrorMessage ?? directErrorMessage ?? d?.message ?? res.statusText;
    const err = new Error(message);
    (err as Error & { status: number }).status = res.status;
    throw err;
  }
  return data;
}

/** Daftar levels. 404 = daftar kosong. */
export async function adminListLevels(): Promise<Level[]> {
  if (typeof window !== "undefined") {
    try {
      const raw = await requestInternalAdmin("/api/admin/levels");
      if (Array.isArray(raw)) return raw as Level[];
      if (raw && typeof raw === "object") {
        const payload = raw as { levels?: Level[]; data?: Level[] };
        if (Array.isArray(payload.levels)) return payload.levels;
        if (Array.isArray(payload.data)) return payload.data;
      }
      return [];
    } catch (e) {
      if (isNotFoundOrMethodNotAllowed(e)) return [];
      // Fallback ke endpoint utama jika route internal gagal/disabled.
    }
  }

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
  if (typeof window !== "undefined") {
    try {
      const raw = await requestInternalAdmin(
        `/api/admin/levels/${encodeURIComponent(levelId)}/subjects`
      );
      if (Array.isArray(raw)) return raw as Subject[];
      if (raw && typeof raw === "object") {
        const payload = raw as { subjects?: Subject[]; data?: Subject[] };
        if (Array.isArray(payload.subjects)) return payload.subjects;
        if (Array.isArray(payload.data)) return payload.data;
      }
      return [];
    } catch (e) {
      if (isNotFoundOrMethodNotAllowed(e)) return [];
      // Fallback ke endpoint utama jika route internal gagal/disabled.
    }
  }

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

function coerceNestedLevel(v: unknown): Level | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const o = v as Record<string, unknown>;
  const id = o.id != null ? String(o.id) : "";
  if (!id) return null;
  return {
    id,
    name: String(o.name ?? ""),
    slug: o.slug != null ? String(o.slug) : null,
    description: o.description != null ? String(o.description) : null,
    sortOrder: o.sortOrder != null ? Number(o.sortOrder) : null,
    iconUrl: o.iconUrl != null ? String(o.iconUrl) : null,
  };
}

function coerceNestedSubject(v: unknown): Subject | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const o = v as Record<string, unknown>;
  const id = o.id != null ? String(o.id) : "";
  if (!id) return null;
  return {
    id,
    name: String(o.name ?? ""),
    slug: o.slug != null ? String(o.slug) : null,
    description: o.description != null ? String(o.description) : null,
    sortOrder: o.sortOrder != null ? Number(o.sortOrder) : null,
    createdAt: o.createdAt != null ? String(o.createdAt) : null,
    updatedAt: o.updatedAt != null ? String(o.updatedAt) : null,
    levelId: o.levelId != null ? String(o.levelId) : null,
  };
}

function coerceNestedSchool(v: unknown): Sekolah | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const o = v as Record<string, unknown>;
  const id = o.id != null ? String(o.id) : "";
  if (!id) return null;
  const namaSekolah =
    String(o.namaSekolah ?? o.nama ?? o.name ?? "").trim() || "—";
  return {
    id,
    namaSekolah,
    npsn: o.npsn != null ? String(o.npsn) : null,
    kabupatenKota:
      o.kabupatenKota != null
        ? String(o.kabupatenKota)
        : o.kabupaten != null
          ? String(o.kabupaten)
          : o.kota != null
            ? String(o.kota)
            : null,
    telepon: o.telepon != null ? String(o.telepon) : o.phone != null ? String(o.phone) : null,
    alamat: o.alamat != null ? String(o.alamat) : o.address != null ? String(o.address) : null,
  };
}

/** Backend kadang membungkus array user (users, data, items, nested data.users). */
function extractUsersFromAdminUsersResponse(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    for (const k of ["users", "data", "items", "results", "records"]) {
      const v = o[k];
      if (Array.isArray(v)) return v;
    }
    const nested = o.data;
    if (nested && typeof nested === "object") {
      const d = nested as Record<string, unknown>;
      for (const k of ["users", "items", "data", "results", "records"]) {
        const v = d[k];
        if (Array.isArray(v)) return v;
      }
    }
  }
  return [];
}

/** Satu baris user dari GET /admin/users → bentuk User (toleran field nama/role). */
function coerceAdminUserRow(row: unknown): User | null {
  if (!row || typeof row !== "object") return null;
  const obj = row as Record<string, unknown>;
  const top =
    obj.data && typeof obj.data === "object" && !Array.isArray(obj.data)
      ? (obj.data as Record<string, unknown>)
      : obj;
  const inner =
    top.user && typeof top.user === "object" ? (top.user as Record<string, unknown>) : top;

  const pickLevelId = (o: Record<string, unknown>): string | null => {
    const lv = o.level;
    if (lv && typeof lv === "object" && !Array.isArray(lv)) {
      const eid = (lv as Record<string, unknown>).id;
      if (eid != null && String(eid).trim()) return String(eid);
    }
    const direct = o.levelId ?? o.educationLevelId ?? o.jenjangId;
    if (direct != null && String(direct).trim()) return String(direct);
    const el = o.educationLevel;
    if (el && typeof el === "object" && !Array.isArray(el)) {
      const eid = (el as Record<string, unknown>).id;
      if (eid != null && String(eid).trim()) return String(eid);
    }
    return null;
  };

  const pickLevelName = (o: Record<string, unknown>): string | null => {
    const lv = o.level;
    if (lv && typeof lv === "object" && !Array.isArray(lv)) {
      const n = (lv as Record<string, unknown>).name;
      if (n != null && String(n).trim()) return String(n);
    }
    const direct = o.levelName ?? o.educationLevelName ?? o.jenjangName ?? o.jenjang;
    if (direct != null && String(direct).trim()) return String(direct);
    const el = o.educationLevel;
    if (el && typeof el === "object" && !Array.isArray(el)) {
      const n = (el as Record<string, unknown>).name;
      if (n != null && String(n).trim()) return String(n);
    }
    return null;
  };

  const pickSubjectId = (o: Record<string, unknown>): string | null => {
    const s = o.subject;
    if (s && typeof s === "object" && !Array.isArray(s)) {
      const sid = (s as Record<string, unknown>).id;
      if (sid != null && String(sid).trim()) return String(sid);
    }
    if (o.subjectId != null && String(o.subjectId).trim()) return String(o.subjectId);
    return null;
  };

  const pickSubjectName = (o: Record<string, unknown>): string | null => {
    const s = o.subject;
    if (s && typeof s === "object" && !Array.isArray(s)) {
      const n = (s as Record<string, unknown>).name;
      if (n != null && String(n).trim()) return String(n);
    }
    if (o.subjectName != null && String(o.subjectName).trim()) return String(o.subjectName);
    return null;
  };

  const pickSchoolId = (o: Record<string, unknown>): string | null => {
    const sch = o.school;
    if (sch && typeof sch === "object" && !Array.isArray(sch)) {
      const sid = (sch as Record<string, unknown>).id;
      if (sid != null && String(sid).trim()) return String(sid);
    }
    if (o.schoolId != null && String(o.schoolId).trim()) return String(o.schoolId);
    return null;
  };

  const pickSchoolName = (o: Record<string, unknown>): string | null => {
    const sch = o.school;
    if (sch && typeof sch === "object" && !Array.isArray(sch)) {
      const sh = sch as Record<string, unknown>;
      const n = sh.namaSekolah ?? sh.nama ?? sh.name;
      if (n != null && String(n).trim()) return String(n);
    }
    if (o.schoolName != null && String(o.schoolName).trim()) return String(o.schoolName);
    return null;
  };

  const mergeSources: Record<string, unknown>[] = [inner];
  for (const key of ["student", "profile", "studentProfile"] as const) {
    const v = inner[key];
    if (v && typeof v === "object" && !Array.isArray(v)) mergeSources.push(v as Record<string, unknown>);
  }

  const id = inner.id != null ? String(inner.id) : "";
  if (!id) return null;
  const nameRaw = inner.name ?? inner.fullName ?? inner.displayName;
  const name =
    String(nameRaw ?? "").trim() || String(inner.email ?? "").trim() || "(Tanpa nama)";
  const email = String(inner.email ?? "").trim();
  const roleRaw = inner.role ?? inner.roleSlug;
  const role = normalizeUserRoleFromApi(String(roleRaw ?? "student"));

  let levelId: string | null = null;
  let levelName: string | null = null;
  let subjectId: string | null = null;
  let subjectName: string | null = null;
  let schoolId: string | null = null;
  let schoolName: string | null = null;
  let classLevel: string | null = null;
  for (const src of mergeSources) {
    if (!levelId) levelId = pickLevelId(src);
    if (!levelName) levelName = pickLevelName(src);
    if (!subjectId) {
      const sid = pickSubjectId(src);
      if (sid) subjectId = sid;
    }
    if (!subjectName) {
      const sn = pickSubjectName(src);
      if (sn) subjectName = sn;
    }
    if (!schoolId) {
      const scid = pickSchoolId(src);
      if (scid) schoolId = scid;
    }
    if (!schoolName) {
      const sn = pickSchoolName(src);
      if (sn) schoolName = sn;
    }
    if (!classLevel && src.classLevel != null && String(src.classLevel).trim()) {
      classLevel = String(src.classLevel);
    }
  }

  const levelObj =
    coerceNestedLevel(inner.level) ??
    mergeSources.map((s) => coerceNestedLevel(s.level)).find((x) => x != null) ??
    null;
  const subjectObj =
    coerceNestedSubject(inner.subject) ??
    mergeSources.map((s) => coerceNestedSubject(s.subject)).find((x) => x != null) ??
    null;
  const schoolObj =
    coerceNestedSchool(inner.school) ??
    mergeSources.map((s) => coerceNestedSchool(s.school)).find((x) => x != null) ??
    null;

  if (levelObj) {
    if (!levelId) levelId = levelObj.id;
    if (!levelName) levelName = levelObj.name;
  }
  if (subjectObj) {
    if (!subjectId) subjectId = subjectObj.id;
    if (!subjectName) subjectName = subjectObj.name;
    if (!levelId && subjectObj.levelId) levelId = subjectObj.levelId;
  }
  if (schoolObj) {
    if (!schoolId) schoolId = schoolObj.id;
    if (!schoolName) schoolName = schoolObj.namaSekolah;
  }

  return {
    id,
    name,
    email,
    role,
    avatarUrl: inner.avatarUrl != null ? String(inner.avatarUrl) : null,
    subjectId,
    schoolId,
    levelId,
    levelName,
    classLevel,
    subjectName,
    schoolName,
    level: levelObj,
    subject: subjectObj,
    school: schoolObj,
  };
}

/** Query opsional GET /admin/users?role=student|guru|admin|... */
export type AdminListUsersParams = {
  role?: string | null;
};

/** Daftar user. GET api/v1/admin/users (?role= opsional). 404 = daftar kosong. */
export async function adminListUsers(params?: AdminListUsersParams | null): Promise<User[]> {
  try {
    const role = params?.role?.trim();
    const path =
      role && role.length > 0
        ? `/admin/users?role=${encodeURIComponent(role)}`
        : "/admin/users";
    const raw = await request<unknown>(path, { method: "GET" });
    const rows = extractUsersFromAdminUsersResponse(raw);
    return rows.map(coerceAdminUserRow).filter((u): u is User => u != null);
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
  const raw = await request<unknown>(`/admin/users/${userId}`, { method: "GET" });
  const coerced = coerceAdminUserRow(raw);
  if (coerced) return coerced;
  return raw as User;
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

/** Satu subject/kelas. GET /admin/subjects/:id — 404 = null jika route belum ada di backend. */
export async function adminGetSubject(subjectId: string): Promise<Subject | null> {
  const sid = encodeURIComponent(subjectId);
  try {
    return await request<Subject>(`/admin/subjects/${sid}`, { method: "GET" });
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return null;
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
    let list: unknown[] = [];
    if (Array.isArray(raw)) list = raw as unknown[];
    else if (raw?.courses && Array.isArray(raw.courses)) list = raw.courses as unknown[];
    else if (raw?.data && Array.isArray(raw.data)) list = raw.data as unknown[];
    return normalizeAdminCourseList(list);
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return [];
    throw e;
  }
}

export async function adminCreateCourseUnderSubject(
  subjectId: string,
  body: AdminCreateCourseRequest
): Promise<Course> {
  const sid = encodeURIComponent(subjectId);
  return request(`/admin/subjects/${sid}/courses`, {
    method: "POST",
    body: { ...body, subjectId },
  });
}

export async function adminUpdateCourse(
  courseId: string,
  body: Partial<AdminCreateCourseRequest>
): Promise<Record<string, never>> {
  const id = encodeURIComponent(courseId.trim());
  return request(`/admin/courses/${id}`, { method: "PUT", body });
}

export async function adminDeleteCourse(courseId: string): Promise<void> {
  const id = encodeURIComponent(courseId.trim());
  return request(`/admin/courses/${id}`, { method: "DELETE" });
}

// --- Course Contents CRUD ---

function extractCourseContentArray(raw: unknown): AdminCourseContent[] {
  if (Array.isArray(raw)) return raw as AdminCourseContent[];
  if (raw && typeof raw === "object") {
    const r = raw as Record<string, unknown>;
    if (Array.isArray(r.data)) return r.data as AdminCourseContent[];
    if (Array.isArray(r.contents)) return r.contents as AdminCourseContent[];
    if (Array.isArray(r.items)) return r.items as AdminCourseContent[];
  }
  return [];
}

/** List konten kelas. GET /admin/courses/:id/contents */
export async function adminListCourseContents(courseId: string): Promise<AdminCourseContent[]> {
  const cid = encodeURIComponent(courseId);
  try {
    const raw = await request<unknown>(`/admin/courses/${cid}/contents`, { method: "GET" });
    return extractCourseContentArray(raw);
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return [];
    throw e;
  }
}

/** Tambah konten ke kelas. POST /admin/courses/:id/contents */
export async function adminAddCourseContent(
  courseId: string,
  body: AdminAddCourseContentRequest
): Promise<AdminCourseContent> {
  const cid = encodeURIComponent(courseId);
  const raw = await request<unknown>(`/admin/courses/${cid}/contents`, { method: "POST", body });
  if (raw && typeof raw === "object") {
    const r = raw as Record<string, unknown>;
    const inner = r.data && typeof r.data === "object" ? (r.data as Record<string, unknown>) : r;
    if (inner.id) return inner as unknown as AdminCourseContent;
  }
  return raw as AdminCourseContent;
}

/** Update konten. PUT /admin/courses/:id/contents/:cid */
export async function adminUpdateCourseContent(
  courseId: string,
  contentId: string,
  body: AdminUpdateCourseContentRequest
): Promise<void> {
  const cid = encodeURIComponent(courseId);
  const kid = encodeURIComponent(contentId);
  await request(`/admin/courses/${cid}/contents/${kid}`, { method: "PUT", body });
}

/** Hapus konten. DELETE /admin/courses/:id/contents/:cid */
export async function adminDeleteCourseContent(
  courseId: string,
  contentId: string
): Promise<void> {
  const cid = encodeURIComponent(courseId);
  const kid = encodeURIComponent(contentId);
  await request(`/admin/courses/${cid}/contents/${kid}`, { method: "DELETE" });
}

function normalizeCourseMaterialUploadResponse(
  raw: unknown
): AdminUploadCourseMaterialResponse {
  if (!raw || typeof raw !== "object") return { url: "" };
  const r = raw as Record<string, unknown>;
  const inner =
    r.data && typeof r.data === "object" && !Array.isArray(r.data)
      ? (r.data as Record<string, unknown>)
      : r;
  const urlCandidate =
    typeof inner.url === "string"
      ? inner.url.trim()
      : typeof inner.fileUrl === "string"
        ? inner.fileUrl.trim()
        : typeof inner.path === "string"
          ? inner.path.trim()
          : "";
  const filename =
    typeof inner.filename === "string"
      ? inner.filename
      : typeof inner.originalName === "string"
        ? inner.originalName
        : typeof inner.name === "string"
          ? inner.name
          : null;
  return { url: urlCandidate, filename };
}

/** Upload file materi (PDF/DOCX/PPTX). POST /admin/upload/course-material */
export async function adminUploadCourseMaterial(
  file: File
): Promise<AdminUploadCourseMaterialResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const raw = await requestFormData<unknown>("/admin/upload/course-material", formData);
  return normalizeCourseMaterialUploadResponse(raw);
}

function unwrapApiData<T extends Record<string, unknown>>(raw: unknown): T | null {  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (r.data && typeof r.data === "object" && !Array.isArray(r.data)) {
    return r.data as T;
  }
  return r as T;
}

function normalizeCourseMeetingRow(o: unknown): CourseMeeting {
  const x = o && typeof o === "object" ? (o as Record<string, unknown>) : {};
  const n = x.meetingNumber;
  const num =
    typeof n === "number" && Number.isFinite(n)
      ? n
      : Number(n) > 0
        ? Number(n)
        : 0;
  return {
    meetingNumber: num,
    title: x.title != null ? String(x.title) : "",
    detailText: x.detailText != null ? String(x.detailText) : "",
    pdfUrl: x.pdfUrl != null ? String(x.pdfUrl) : "",
    prTitle: x.prTitle != null ? String(x.prTitle) : "",
    prDescription: x.prDescription != null ? String(x.prDescription) : "",
    liveClassUrl: x.liveClassUrl != null ? String(x.liveClassUrl) : "",
  };
}

function ensureEightMeetings(meetings: CourseMeeting[]): CourseMeeting[] {
  const byNum = new Map<number, CourseMeeting>();
  meetings.forEach((m) => {
    const n = m.meetingNumber;
    if (typeof n === "number" && n >= 1 && n <= 8) byNum.set(n, m);
  });
  return Array.from({ length: 8 }, (_, i) => {
    const meetingNumber = i + 1;
    const existing = byNum.get(meetingNumber);
    if (existing) return { ...existing, meetingNumber };
    return {
      meetingNumber,
      title: "",
      detailText: "",
      pdfUrl: "",
      prTitle: "",
      prDescription: "",
      liveClassUrl: "",
    };
  });
}

/** Satu course. GET /admin/courses/:courseId — dinormalisasi seperti daftar (status, subjectId, …). */
export async function adminGetCourse(courseId: string): Promise<Course> {
  const cid = encodeURIComponent(courseId.trim());
  const raw = await request<unknown>(`/admin/courses/${cid}`, { method: "GET" });
  const obj = unwrapApiData<Record<string, unknown>>(raw) ?? (raw as Record<string, unknown>);
  return normalizeAdminCourseItem(obj);
}

/** Ringkasan kelola course + relatedEndpoints (getProgram, putProgram, dll.). */
export async function adminGetCourseManage(courseId: string): Promise<AdminCourseManageResponse> {
  const cid = encodeURIComponent(courseId);
  return request<AdminCourseManageResponse>(`/admin/courses/${cid}/manage`, { method: "GET" });
}

/** Program kelas: track, 1–8 pertemuan, pre-test tryout. GET /admin/courses/:courseId/program */
export async function adminGetCourseProgram(courseId: string): Promise<CourseProgramPayload> {
  const cid = encodeURIComponent(courseId);
  const raw = await request<unknown>(`/admin/courses/${cid}/program`, { method: "GET" });
  const obj = unwrapApiData<Record<string, unknown>>(raw) ?? (raw as Record<string, unknown>);
  const meetingsRaw = Array.isArray(obj.meetings) ? obj.meetings : [];
  const tt = obj.trackType;
  const trackType: CourseTrackType = tt === "tryout" ? "tryout" : "meetings";
  const pre = obj.pretestTryoutSessionId;
  return {
    trackType,
    meetings: ensureEightMeetings(meetingsRaw.map(normalizeCourseMeetingRow)),
    pretestTryoutSessionId:
      pre != null && String(pre).trim() !== "" ? String(pre).trim() : null,
  };
}

/** Simpan program + rebuild learning journey. PUT /admin/courses/:courseId/program */
export async function adminPutCourseProgram(
  courseId: string,
  body: CourseProgramPayload
): Promise<{ message?: string }> {
  const cid = encodeURIComponent(courseId);
  return request(`/admin/courses/${cid}/program`, { method: "PUT", body });
}

/** Urutan tryout terhubung ke kelas. PUT /admin/courses/:courseId/linked-tryouts */
export async function adminPutCourseLinkedTryouts(
  courseId: string,
  body: AdminCourseLinkedTryoutsRequest
): Promise<Record<string, unknown>> {
  const cid = encodeURIComponent(courseId);
  return request(`/admin/courses/${cid}/linked-tryouts`, { method: "PUT", body });
}

// --- Admin vouchers: GET/POST /admin/vouchers, GET/PUT/DELETE /admin/vouchers/:id (permission vouchers.manage) ---

function extractVoucherArray(raw: unknown): AdminVoucher[] {
  if (Array.isArray(raw)) return raw as AdminVoucher[];
  if (raw && typeof raw === "object" && Array.isArray((raw as { data?: unknown }).data)) {
    return (raw as { data: AdminVoucher[] }).data;
  }
  return [];
}

function unwrapVoucherResponse(raw: unknown): AdminVoucher {
  const nested = unwrapApiData(raw as Record<string, unknown>);
  if (nested && typeof nested.id === "string") {
    return nested as unknown as AdminVoucher;
  }
  if (raw && typeof raw === "object" && typeof (raw as AdminVoucher).id === "string") {
    return raw as AdminVoucher;
  }
  throw new Error("Respons voucher tidak valid");
}

/** Daftar voucher. GET /admin/vouchers → { data: [...] } */
export async function adminListVouchers(): Promise<AdminVoucher[]> {
  try {
    const raw = await request<unknown>("/admin/vouchers", { method: "GET" });
    return extractVoucherArray(raw);
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return [];
    throw e;
  }
}

/** Detail voucher. GET /admin/vouchers/:id */
export async function adminGetVoucher(voucherId: string): Promise<AdminVoucher | null> {
  const id = encodeURIComponent(voucherId.trim());
  try {
    const raw = await request<unknown>(`/admin/vouchers/${id}`, { method: "GET" });
    if (raw && typeof raw === "object" && typeof (raw as AdminVoucher).id === "string") {
      return raw as AdminVoucher;
    }
    const u = unwrapApiData(raw as Record<string, unknown>);
    if (u && typeof (u as { id?: string }).id === "string") {
      return u as unknown as AdminVoucher;
    }
    return null;
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return null;
    throw e;
  }
}

/** Buat voucher. POST /admin/vouchers */
export async function adminCreateVoucher(body: AdminCreateVoucherRequest): Promise<AdminVoucher> {
  const raw = await request<unknown>("/admin/vouchers", { method: "POST", body });
  return unwrapVoucherResponse(raw);
}

/** Update parsial. PUT /admin/vouchers/:id */
export async function adminUpdateVoucher(
  voucherId: string,
  body: AdminUpdateVoucherRequest
): Promise<AdminVoucher> {
  const id = encodeURIComponent(voucherId.trim());
  const raw = await request<unknown>(`/admin/vouchers/${id}`, { method: "PUT", body });
  return unwrapVoucherResponse(raw);
}

/** Hapus voucher. DELETE /admin/vouchers/:id → 204 */
export async function adminDeleteVoucher(voucherId: string): Promise<void> {
  const id = encodeURIComponent(voucherId.trim());
  await request(`/admin/vouchers/${id}`, { method: "DELETE" });
}

/** Klaim voucher (siswa). POST /vouchers/claim → 204 */
export async function studentClaimVoucher(code: string): Promise<void> {
  await request("/vouchers/claim", {
    method: "POST",
    body: { code: code.trim() },
  });
}

/** Voucher yang sudah diklaim. GET /vouchers/mine */
export async function studentListMyVouchers(): Promise<StudentVoucherClaim[]> {
  try {
    const raw = await request<unknown>("/vouchers/mine", { method: "GET" });
    if (Array.isArray(raw)) return raw as StudentVoucherClaim[];
    if (raw && typeof raw === "object" && Array.isArray((raw as { data?: unknown }).data)) {
      return (raw as { data: StudentVoucherClaim[] }).data;
    }
    return [];
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return [];
    throw e;
  }
}

function extractAiQuestionArray(raw: unknown): AiQuestionItem[] {
  const nested = unwrapApiData(raw as Record<string, unknown>);
  if (Array.isArray(nested)) return nested as AiQuestionItem[];
  if (Array.isArray(raw)) return raw as AiQuestionItem[];
  return [];
}

function toQueryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value == null) continue;
    const text = String(value).trim();
    if (!text) continue;
    search.set(key, text);
  }
  const built = search.toString();
  return built ? `?${built}` : "";
}

/** Normalisasi respons GET /subscription (flat, { data }, { subscription }, atau array). */
function normalizeSubscriptionPayload(raw: unknown): Subscription | null {
  if (raw == null) return null;
  if (Array.isArray(raw)) {
    for (const item of raw) {
      const one = normalizeSubscriptionPayload(item);
      if (one) return one;
    }
    return null;
  }
  if (typeof raw !== "object") return null;
  const top = raw as Record<string, unknown>;
  const inner =
    unwrapApiData<Record<string, unknown>>(top) ??
    (top.subscription && typeof top.subscription === "object"
      ? (top.subscription as Record<string, unknown>)
      : null) ??
    (top.current && typeof top.current === "object" ? (top.current as Record<string, unknown>) : null) ??
    top;
  if (!inner || typeof inner !== "object") return null;
  const id = inner.id != null ? String(inner.id) : "";
  if (!id) return null;
  return {
    id,
    userId: inner.userId != null ? String(inner.userId) : "",
    planCode: String(inner.planCode ?? inner.plan ?? ""),
    status: String(inner.status ?? ""),
    startAt: String(inner.startAt ?? inner.startsAt ?? ""),
    endAt: String(inner.endAt ?? inner.expiresAt ?? ""),
    createdAt: inner.createdAt != null ? String(inner.createdAt) : undefined,
  };
}

/** Langganan AI untuk user Bearer saat ini. GET /subscription — 404/405 = null. */
export async function getMySubscription(): Promise<Subscription | null> {
  try {
    const raw = await request<unknown>("/subscription", { method: "GET" });
    return normalizeSubscriptionPayload(raw);
  } catch (e) {
    if (isNotFoundOrMethodNotAllowed(e)) return null;
    throw e;
  }
}

/** Generate pertanyaan AI. POST /generate-questions */
export async function aiGenerateQuestions(body: GenerateQuestionsRequest): Promise<AiQuestionItem[]> {
  const raw = await request<unknown>("/generate-questions", { method: "POST", body });
  return extractAiQuestionArray(raw);
}

/** Submit jawaban satu soal. POST /submit-answer */
export async function aiSubmitAnswer(body: SubmitAnswerRequest): Promise<SubmitAnswerResponse> {
  return request<SubmitAnswerResponse>("/submit-answer", { method: "POST", body });
}

/** Analisis akurasi & rekomendasi. GET /analysis?topic=&grade= */
export async function aiGetAnalysis(params: {
  topic?: string;
  grade?: string;
}): Promise<AiAnalysisResponse> {
  const query = toQueryString({ topic: params.topic, grade: params.grade });
  return request<AiAnalysisResponse>(`/analysis${query}`, { method: "GET" });
}

/** Ranking nasional. GET /ranking?limit= */
export async function aiGetRanking(limit = 20): Promise<RankingEntry[]> {
  const raw = await request<unknown>(`/ranking${toQueryString({ limit })}`, {
    method: "GET",
    auth: false,
  });
  const nested = unwrapApiData(raw as Record<string, unknown>);
  if (Array.isArray(nested)) return nested as RankingEntry[];
  if (Array.isArray(raw)) return raw as RankingEntry[];
  return [];
}

/** List pertanyaan dengan filter. GET /questions?subject=&grade=&topic=&difficulty=&limit= */
export async function aiListQuestions(params: QuestionsQuery): Promise<AiQuestionItem[]> {
  const query = toQueryString({
    subject: params.subject,
    grade: params.grade,
    topic: params.topic,
    difficulty: params.difficulty,
    limit: params.limit,
  });
  const raw = await request<unknown>(`/questions${query}`, { method: "GET" });
  return extractAiQuestionArray(raw);
}

/**
 * Buat / perpanjang langganan AI untuk Bearer saat ini. POST /subscription
 * (biasanya setelah pembayaran terverifikasi atau oleh admin).
 */
export async function aiCreateSubscription(
  body: CreateSubscriptionRequest
): Promise<Subscription> {
  const raw = await request<unknown>("/subscription", { method: "POST", body });
  const done = normalizeSubscriptionPayload(raw);
  if (done) return done;
  return raw as Subscription;
}

/** Alias eksplisit (sama dengan `aiCreateSubscription`). */
export const createMyAiSubscription = aiCreateSubscription;
