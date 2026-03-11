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
  /** Role saat mendaftar: student (default), siswa (alias), atau guru. Sesuai backend. */
  role?: "student" | "siswa" | "guru";
}

export interface RegisterResponse {
  user: User;
  token: string;
}

/** Status guru/trainer: slot bayar vs siswa terdaftar. Dari GET /trainer/status atau setara. */
export interface TrainerStatusResponse {
  /** Jumlah slot yang sudah dibayar (boleh dipakai untuk mendaftarkan siswa). */
  paid_slots: number;
  /** Jumlah siswa yang sudah didaftarkan (maksimal paid_slots). */
  registered_students_count: number;
  /** Daftar siswa yang didaftarkan oleh guru ini (opsional). */
  students?: { id: string; name: string; email: string }[];
}

/** Request bayar slot pendaftaran siswa. POST /trainer/pay atau setara. */
export interface TrainerPayRequest {
  /** Jumlah siswa yang dibayar (slot). */
  quantity: number;
}

/** Request tambah siswa oleh guru. POST /trainer/students atau setara. */
export interface TrainerAddStudentRequest {
  name: string;
  email: string;
  password: string;
}

/** Response GET /trainer/profile. Profil guru dan info sekolah (jika ada). */
export interface TrainerProfileResponse {
  name?: string;
  email?: string;
  /** Info sekolah yang terhubung dengan guru (dari backend). */
  school?: Sekolah | null;
}

/** Request update profil guru. PUT /trainer/profile. */
export interface TrainerProfileUpdateRequest {
  name?: string;
  /** ID sekolah untuk dikaitkan; string kosong untuk melepas sekolah. */
  school_id?: string | null;
}

/** Request buat sekolah oleh guru. POST /trainer/schools. */
export interface TrainerCreateSchoolRequest {
  nama_sekolah: string;
  npsn?: string | null;
  alamat?: string | null;
  kabupaten_kota?: string | null;
  telepon?: string | null;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

/** Ubah kata sandi (user sudah login). Backend: PUT /auth/change-password atau POST /trainer/change-password. */
export interface ChangePasswordRequest {
  current_password: string;
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
  /** Teks/HTML soal. Dapat berisi tag HTML, <pre><code> untuk kode, <img> untuk gambar. */
  body: string;
  options: string[] | null;
  max_score: number;
  /** URL gambar (opsional, dari backend). Gambar juga bisa disisipkan di body sebagai <img>. */
  image_url?: string | null;
}

/** Statistik per soal (dari backend jika ada). GET /admin/tryouts/:id/questions/:qid/stats atau field stats pada question. */
export interface QuestionStats {
  participants_count?: number;
  answered_count?: number;
  correct_count?: number;
  wrong_count?: number;
  correct_percent?: number;
  wrong_percent?: number;
}

/** Satu entri statistik soal dalam response bulk GET /admin/tryouts/:id/questions/stats */
export interface QuestionStatsItem {
  question_id: string;
  answered_count?: number;
  correct_count?: number;
  wrong_count?: number;
  correct_percent?: number;
  wrong_percent?: number;
}

/** Response GET /admin/tryouts/:tryoutId/questions/stats (statistik semua soal sekaligus) */
export interface TryoutQuestionStatsBulkResponse {
  participants_count?: number;
  questions: QuestionStatsItem[];
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

/** Satu soal dalam review attempt (jawaban benar/salah). */
export interface AttemptReviewItem {
  question_id: string;
  body: string;
  type?: string;
  options?: string[] | null;
  correct_answer?: string | null;
  user_answer?: string | null;
  is_correct?: boolean;
  sort_order?: number;
  image_url?: string | null;
}

export interface AttemptReviewResponse {
  items?: AttemptReviewItem[];
  questions?: AttemptReviewItem[];
}

export interface Certificate {
  id: string;
  user_id: string;
  tryout_session_id: string | null;
  course_id: string | null;
  issued_at: string;
}

// --- Dashboard umum (GET /dashboard) ---
/** Satu entri leaderboard dari API (rank, user_name, school_name, best_score, has_attempt). */
export interface LeaderboardEntry {
  rank?: number;
  user_id?: string;
  user_name?: string;
  name?: string;
  nama?: string;
  school_name?: string;
  score?: number;
  skor?: number;
  best_score?: number;
  has_attempt?: boolean;
  tryout_title?: string;
  tryout_id?: string;
  [key: string]: unknown;
}

/** Response GET /api/v1/dashboard (dashboard umum). Bisa berisi leaderboard. */
export interface DashboardResponse {
  leaderboard?: LeaderboardEntry[];
  [key: string]: unknown;
}

// --- Student dashboard ---
export interface StudentDashboardSummary {
  total_attempts: number;
  avg_score: number;
  avg_percentile: number;
}

/** Nama siswa dari DB bisa dikembalikan di dashboard sebagai user/student.name atau user/student.nama.
 * Backend bisa mengirim strength_areas/kekuatan, improvement_areas/perlu_ditingkatkan, recommendation/rekomendasi. */
export interface StudentDashboardResponse {
  summary: StudentDashboardSummary;
  open_tryouts: TryoutSession[];
  recent_attempts: (Attempt & { tryout_title?: string })[];
  strength_areas: string[];
  improvement_areas: string[];
  recommendation: string;
  user?: { name?: string; nama?: string };
  student?: { name?: string; nama?: string };
  /** Tanggal expired akses/langganan siswa (ISO string). Jika ada dan sudah lewat, frontend akan logout & redirect ke login. */
  expires_at?: string;
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
/** Response GET /admin/overview. Backend bisa mengembalikan field dengan nama lain. */
export interface AdminOverviewResponse {
  total_students?: number;
  active_tryouts?: number;
  avg_score?: number;
  total_certificates?: number;
  /** Nama alternatif dari backend */
  total_student?: number;
  total_certificate?: number;
  active_tryout?: number;
  average_score?: number;
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

// --- Admin Tryout Analysis ---
/** Analisis & grafik per tryout (per soal). GET /admin/tryouts/:tryoutId/analysis */
export interface AdminTryoutAnalysis {
  tryout_id?: string;
  questions?: Array<{
    question_id?: string;
    sort_order?: number;
    answered_count?: number;
    correct_count?: number;
    wrong_count?: number;
    correct_percent?: number;
    [key: string]: unknown;
  }>;
  participants_count?: number;
  [key: string]: unknown;
}

/** Siswa yang submit tryout. GET /admin/tryouts/:tryoutId/students */
export interface AdminTryoutStudent {
  id?: string;
  user_id?: string;
  attempt_id?: string;
  name?: string;
  email?: string;
  school_name?: string;
  score?: number;
  submitted_at?: string;
  [key: string]: unknown;
}

/** Analisis AI per attempt. GET /admin/tryouts/:tryoutId/attempts/:attemptId/ai-analysis */
export interface AdminTryoutAttemptAiAnalysis {
  attempt_id?: string;
  user_id?: string;
  summary?: string;
  strength_areas?: string[];
  improvement_areas?: string[];
  recommendation?: string;
  [key: string]: unknown;
}

// --- Notifications (GET /notifications, PATCH /notifications/:id/read) ---
export interface Notification {
  id: string;
  user_id?: string;
  title?: string;
  body?: string;
  read_at?: string | null;
  created_at?: string;
  type?: string;
  [key: string]: unknown;
}

// --- Payments (user: GET /payments, POST /payments) ---
export interface Payment {
  id: string;
  user_id?: string;
  amount_cents?: number;
  amount?: number;
  type?: string;
  status?: string;
  reference_id?: string | null;
  proof_url?: string | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface CreatePaymentRequest {
  amount_cents: number;
  type: string;
  reference_id: string;
  proof_url?: string;
}

// --- Course messages & discussions (untuk user yang ter-enroll) ---
export interface CourseMessage {
  id: string;
  course_id?: string;
  user_id?: string;
  user_name?: string;
  message: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface CourseDiscussion {
  id: string;
  course_id?: string;
  user_id?: string;
  title: string;
  body?: string;
  created_at?: string;
  reply_count?: number;
  [key: string]: unknown;
}

export interface DiscussionReply {
  id: string;
  discussion_id?: string;
  user_id?: string;
  user_name?: string;
  body: string;
  created_at?: string;
  [key: string]: unknown;
}

/** Request buat kelas oleh trainer. POST /trainer/courses */
export interface TrainerCourseCreateRequest {
  title: string;
  description?: string | null;
}
