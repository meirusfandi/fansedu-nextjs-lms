/** API types for FansEdu LMS v1 (matches Go backend) */

export type UserRole = "admin" | "student" | "trainer";

/** Role dari GET /admin/roles */
export interface Role {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
}

/** Level (jenjang pendidikan) dari GET/POST /admin/levels */
export interface Level {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  sort_order?: number | null;
  icon_url?: string | null;
}

export interface AdminCreateLevelRequest {
  name: string;
  slug?: string | null;
  description?: string | null;
  sort_order?: number | null;
  icon_url?: string | null;
}

export interface AdminUpdateLevelRequest {
  name?: string;
  slug?: string | null;
  description?: string | null;
  sort_order?: number | null;
}

/** Sesuai response backend: { id, name, email, role }. avatar_url opsional. */
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar_url?: string | null;
  subject_id?: string | null;
  school_id?: string | null;
  /** Nama subject/bidang (dari API atau lookup) */
  subject_name?: string | null;
  /** Nama sekolah (dari API atau lookup) */
  school_name?: string | null;
}

// --- Auth ---
export interface LoginRequest {
  email: string;
  password: string;
}

/** Format response backend: { user: { id, name, email, role }, token } */
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

export type EventCategorySlug = "tryout" | "free_class" | "paid_class";

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
  /** Kategori event: tryout, free_class, paid_class. Dari Master Data Event. */
  event_category?: EventCategorySlug | string | null;
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

// --- Subjects (Bidang) ---
export interface Subject {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  sort_order?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

// --- Courses ---
export interface Course {
  id: string;
  title: string;
  description?: string | null;
  created_by: string | null;
  subject_id?: string | null;
  sort_order?: number | null;
}

export interface CourseEnrollment {
  id: string;
  user_id: string;
  course_id: string;
  status: "enrolled" | "in_progress" | "completed";
  enrolled_at: string;
  completed_at: string | null;
}

// --- Master Data Sekolah ---
export interface Sekolah {
  id: string;
  nama_sekolah: string;
  npsn?: string | null;
  kabupaten_kota?: string | null;
  telepon?: string | null;
  alamat?: string | null;
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
  /** Kategori event: tryout, free_class, paid_class. */
  event_category?: EventCategorySlug | string | null;
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
  subject_id?: string | null;
  sort_order?: number | null;
}

export interface AdminCreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: "student" | "trainer";
  subject_id?: string | null;
  school_id?: string | null;
}

export interface AdminUpdateUserRequest {
  name?: string;
  email?: string;
  password?: string;
  role?: "student" | "trainer";
  subject_id?: string | null;
  school_id?: string | null;
}

export interface AdminCreateSubjectRequest {
  name: string;
  slug?: string | null;
  description?: string | null;
  sort_order?: number | null;
  level_id?: string | null;
}

export interface AdminIssueCertificateRequest {
  user_id: string;
  tryout_session_id?: string | null;
  course_id?: string | null;
}
