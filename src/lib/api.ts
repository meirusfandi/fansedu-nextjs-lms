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
  Certificate,
  Course,
  CourseEnrollment,
  ForgotPasswordRequest,
  Level,
  LoginRequest,
  LoginResponse,
  PutAnswerRequest,
  Question,
  RegisterRequest,
  RegisterResponse,
  ResetPasswordRequest,
  Role,
  StudentDashboardResponse,
  Subject,
  SubmitAttemptResponse,
  StartTryoutResponse,
  TryoutSession,
  User,
} from "./api-types";

const BASE = typeof window !== "undefined" ? getBaseUrl() : "";

/** Di browser panggil same-origin /api/v1/... (forward ke backend). Di server pakai URL backend langsung. */
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

function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/auth_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function setAuthToken(
  token: string,
  maxAgeSeconds = 604800,
  role?: "admin" | "student"
): void {
  if (typeof document === "undefined") return;
  document.cookie = `auth_token=${encodeURIComponent(token)}; path=/; max-age=${maxAgeSeconds}; SameSite=Strict`;
  if (role) {
    document.cookie = `auth_role=${role}; path=/; max-age=${maxAgeSeconds}; SameSite=Strict`;
  }
}

export function clearAuthToken(): void {
  if (typeof document === "undefined") return;
  document.cookie = "auth_token=; path=/; max-age=0";
  document.cookie = "auth_role=; path=/; max-age=0";
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
  const res = await fetch(url, {
    method: verb,
    headers,
    body: hasBody ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const d = data as { error?: string; message?: string };
    const message = d?.error ?? d?.message ?? res.statusText;
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
/** Daftar tryout yang buka. 404 = daftar kosong. */
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

export async function getTryout(tryoutId: string): Promise<TryoutSession> {
  return request(`/tryouts/${tryoutId}`, { method: "GET", auth: false });
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

// --- Student ---
export async function getStudentDashboard(): Promise<StudentDashboardResponse> {
  return request("/student/dashboard", { method: "GET" });
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
export async function getAdminOverview(): Promise<AdminOverviewResponse> {
  return request("/admin/overview", { method: "GET" });
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

export async function adminCreateQuestion(
  tryoutId: string,
  body: AdminCreateQuestionRequest
): Promise<Question> {
  return request(`/admin/tryouts/${tryoutId}/questions`, {
    method: "POST",
    body,
  });
}

export async function adminUpdateQuestion(
  questionId: string,
  body: Partial<AdminCreateQuestionRequest>
): Promise<Record<string, never>> {
  return request(`/admin/questions/${questionId}`, { method: "PUT", body });
}

export async function adminDeleteQuestion(
  questionId: string
): Promise<void> {
  return request(`/admin/questions/${questionId}`, { method: "DELETE" });
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

// --- Admin Users ---
/** Daftar semua user. 404 = daftar kosong. */
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
