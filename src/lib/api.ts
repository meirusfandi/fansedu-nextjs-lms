/**
 * API client for FansEdu LMS v1 (Go backend).
 * Set NEXT_PUBLIC_API_URL in .env (e.g. http://localhost:8080).
 */

import type {
  AdminCreateCourseRequest,
  AdminCreateQuestionRequest,
  AdminCreateSubjectRequest,
  AdminCreateTryoutRequest,
  AdminCreateUserRequest,
  AdminIssueCertificateRequest,
  AdminOverviewResponse,
  Attempt,
  Certificate,
  Course,
  CourseEnrollment,
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  PutAnswerRequest,
  Question,
  RegisterRequest,
  RegisterResponse,
  ResetPasswordRequest,
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
  return url.replace(/\/$/, "") + "/v1";
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
export async function listOpenTryouts(): Promise<TryoutSession[]> {
  return request("/tryouts/open", { method: "GET", auth: false });
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
export async function getAttemptQuestions(
  attemptId: string
): Promise<Question[]> {
  return request(`/attempts/${attemptId}/questions`, { method: "GET" });
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

export async function getStudentAttempts(): Promise<Attempt[]> {
  return request("/student/attempts", { method: "GET" });
}

export async function getStudentAttemptDetail(
  attemptId: string
): Promise<Attempt> {
  return request(`/student/attempts/${attemptId}`, { method: "GET" });
}

export async function getStudentCertificates(): Promise<Certificate[]> {
  return request("/student/certificates", { method: "GET" });
}

// --- Courses ---
export async function listCourses(): Promise<Course[]> {
  return request("/courses/", { method: "GET", auth: false });
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
  return request("/admin/tryouts", { method: "GET" });
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

export async function adminGetCourseEnrollments(
  courseId: string
): Promise<CourseEnrollment[]> {
  return request(`/admin/courses/${courseId}/enrollments`, { method: "GET" });
}

export async function adminIssueCertificate(
  body: AdminIssueCertificateRequest
): Promise<Certificate> {
  return request("/admin/certificates", { method: "POST", body });
}

// --- Admin Users ---
export async function adminListUsers(): Promise<User[]> {
  return request("/admin/users", { method: "GET" });
}

export async function adminCreateUser(
  body: AdminCreateUserRequest
): Promise<User> {
  return request("/admin/users", { method: "POST", body });
}

// --- Admin Subjects (Bidang) ---
export async function adminListSubjects(): Promise<Subject[]> {
  return request("/admin/subjects", { method: "GET" });
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
export async function adminListCoursesBySubject(
  subjectId: string
): Promise<Course[]> {
  return request(`/admin/subjects/${subjectId}/courses`, { method: "GET" });
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
