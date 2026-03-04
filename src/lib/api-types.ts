/** API types for FansEdu LMS v1 (matches Go backend) */

export type UserRole = "admin" | "student";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar_url?: string | null;
}

// --- Auth ---
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  user: User;
  token: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

// --- Tryouts ---
export type TryoutLevel = "easy" | "medium" | "hard";
export type TryoutStatus = "draft" | "open" | "closed";

export interface TryoutSession {
  id: string;
  title: string;
  short_title?: string | null;
  description?: string | null;
  duration_minutes: number;
  questions_count: number;
  level: TryoutLevel;
  opens_at: string;
  closes_at: string;
  max_participants?: number | null;
  status: TryoutStatus;
}

export interface StartTryoutResponse {
  attempt_id: string;
  expires_at: string;
  time_left_seconds: number;
}

// --- Questions ---
export type QuestionType = "short" | "multiple_choice" | "true_false";

export interface Question {
  id: string;
  tryout_session_id: string;
  sort_order: number;
  type: QuestionType;
  body: string;
  options: string[] | null;
  max_score: number;
}

// --- Attempts ---
export interface PutAnswerRequest {
  answer_text?: string | null;
  selected_option?: string | null;
  is_marked?: boolean;
}

export interface AttemptFeedback {
  summary?: string | null;
  recap?: string | null;
  strength_areas?: string[] | null;
  improvement_areas?: string[] | null;
  recommendation_text?: string | null;
}

export interface SubmitAttemptResponse {
  attempt_id: string;
  score: number;
  percentile: number;
  feedback: AttemptFeedback;
}

export interface Attempt {
  id: string;
  user_id: string;
  tryout_session_id: string;
  started_at: string;
  submitted_at: string | null;
  status: "in_progress" | "submitted" | "expired";
  score: number | null;
  max_score: number | null;
  percentile: number | null;
  time_seconds_spent: number | null;
}

export interface Certificate {
  id: string;
  user_id: string;
  tryout_session_id: string | null;
  course_id: string | null;
  issued_at: string;
}

// --- Student dashboard ---
export interface StudentDashboardSummary {
  total_attempts: number;
  avg_score: number;
  avg_percentile: number;
}

export interface StudentDashboardResponse {
  summary: StudentDashboardSummary;
  open_tryouts: TryoutSession[];
  recent_attempts: (Attempt & { tryout_title?: string })[];
  strength_areas: string[];
  improvement_areas: string[];
  recommendation: string;
}

// --- Courses ---
export interface Course {
  id: string;
  title: string;
  description?: string | null;
  created_by: string | null;
}

export interface CourseEnrollment {
  id: string;
  user_id: string;
  course_id: string;
  status: "enrolled" | "in_progress" | "completed";
  enrolled_at: string;
  completed_at: string | null;
}

// --- Admin ---
export interface AdminOverviewResponse {
  total_students: number;
  active_tryouts: number;
  avg_score: number;
  total_certificates: number;
}

export interface AdminCreateTryoutRequest {
  title: string;
  short_title?: string | null;
  description?: string | null;
  duration_minutes: number;
  questions_count: number;
  level: TryoutLevel;
  opens_at: string;
  closes_at: string;
  max_participants?: number | null;
  status?: TryoutStatus;
}

export interface AdminCreateQuestionRequest {
  sort_order: number;
  type: QuestionType;
  body: string;
  options?: string[] | null;
  max_score?: number;
}

export interface AdminCreateCourseRequest {
  title: string;
  description?: string | null;
}

export interface AdminIssueCertificateRequest {
  user_id: string;
  tryout_session_id?: string | null;
  course_id?: string | null;
}
