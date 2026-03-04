/**
 * API client for FansEdu LMS v1 (Go backend).
 * Set NEXT_PUBLIC_API_URL in .env (e.g. http://localhost:8080).
 */

import type {
  AdminCreateCourseRequest,
  AdminCreateQuestionRequest,
  AdminCreateTryoutRequest,
  AdminIssueCertificateRequest,
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
  TryoutSession,
  AdminOverviewResponse,
  SubmitAttemptResponse,
  StartTryoutResponse,
} from "./api-types";

const BASE = typeof window !== "undefined" ? getBaseUrl() : "";

function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL ?? "";
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
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, auth = true } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error((data as { error?: string }).error ?? res.statusText);
    (err as Error & { status: number }).status = res.status;
    throw err;
  }
  return data as T;
}

// --- Health ---
export async function healthCheck(): Promise<{ status: string; time: string }> {
  return request("/health", { auth: false });
}

// --- Auth ---
export async function login(body: LoginRequest): Promise<LoginResponse> {
  return request("/auth/login", { method: "POST", body, auth: false });
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
  return request("/tryouts/open", { auth: false });
}

export async function getTryout(tryoutId: string): Promise<TryoutSession> {
  return request(`/tryouts/${tryoutId}`, { auth: false });
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
  return request(`/attempts/${attemptId}/questions`);
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
  return request("/student/dashboard");
}

export async function getStudentAttempts(): Promise<Attempt[]> {
  return request("/student/attempts");
}

export async function getStudentAttemptDetail(
  attemptId: string
): Promise<Attempt> {
  return request(`/student/attempts/${attemptId}`);
}

export async function getStudentCertificates(): Promise<Certificate[]> {
  return request("/student/certificates");
}

// --- Courses ---
export async function listCourses(): Promise<Course[]> {
  return request("/courses/", { auth: false });
}

export async function enrollCourse(
  courseId: string
): Promise<CourseEnrollment> {
  return request(`/courses/${courseId}/enroll`, { method: "POST" });
}

// --- Admin ---
export async function getAdminOverview(): Promise<AdminOverviewResponse> {
  return request("/admin/overview");
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
  return request(`/admin/courses/${courseId}/enrollments`);
}

export async function adminIssueCertificate(
  body: AdminIssueCertificateRequest
): Promise<Certificate> {
  return request("/admin/certificates", { method: "POST", body });
}
