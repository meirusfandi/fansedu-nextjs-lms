/** API types for FansEdu LMS v1 (camelCase JSON — backend Go). */

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
  sortOrder?: number | null;
  iconUrl?: string | null;
}

export interface AdminCreateLevelRequest {
  name: string;
  slug?: string | null;
  description?: string | null;
  sortOrder?: number | null;
  iconUrl?: string | null;
}

export interface AdminUpdateLevelRequest {
  name?: string;
  slug?: string | null;
  description?: string | null;
  sortOrder?: number | null;
}

/** Sesuai response backend: { id, name, email, role }. avatarUrl opsional. */
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string | null;
  subjectId?: string | null;
  schoolId?: string | null;
  /** Nama subject/bidang (dari API atau lookup) */
  subjectName?: string | null;
  /** Nama sekolah (dari API atau lookup) */
  schoolName?: string | null;
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
  /** Role saat mendaftar (backend). Di app ini self-service hanya mengirim `guru` (trainer). */
  role?: "student" | "siswa" | "guru";
}

export interface RegisterResponse {
  user: User;
  token: string;
}

/** Status guru/trainer: slot bayar vs siswa terdaftar. Dari GET /trainer/status atau setara. */
export interface TrainerStatusResponse {
  /** Jumlah slot yang sudah dibayar (boleh dipakai untuk mendaftarkan siswa). */
  paidSlots: number;
  /** Jumlah siswa yang sudah didaftarkan (maksimal paidSlots). */
  registeredStudentsCount: number;
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
  schoolId?: string | null;
}

/** Request buat sekolah oleh guru. POST /trainer/schools. */
export interface TrainerCreateSchoolRequest {
  namaSekolah: string;
  npsn?: string | null;
  alamat?: string | null;
  kabupatenKota?: string | null;
  telepon?: string | null;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

/** Ubah kata sandi (user sudah login). Backend: PUT /auth/change-password atau POST /trainer/change-password. */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// --- Tryouts ---
export type TryoutLevel = "easy" | "medium" | "hard";
export type TryoutStatus = "draft" | "open" | "closed";

export type EventCategorySlug = "tryout" | "free_class" | "paid_class";

export interface TryoutSession {
  id: string;
  title: string;
  shortTitle?: string | null;
  description?: string | null;
  durationMinutes: number;
  questionsCount: number;
  level: TryoutLevel;
  opensAt: string;
  closesAt: string;
  maxParticipants?: number | null;
  status: TryoutStatus;
  /** Kategori event: tryout, free_class, paid_class. Dari Master Data Event. */
  eventCategory?: EventCategorySlug | string | null;
}

export interface StartTryoutResponse {
  attemptId: string;
  expiresAt: string;
  timeLeftSeconds: number;
}

// --- Questions ---
export type QuestionType = "short" | "multiple_choice" | "true_false";

export interface Question {
  id: string;
  tryoutSessionId: string;
  sortOrder: number;
  type: QuestionType;
  /** Teks/HTML soal. Dapat berisi tag HTML, <pre><code> untuk kode, <img> untuk gambar. */
  body: string;
  options: string[] | null;
  maxScore: number;
  /** URL gambar (opsional, dari backend). Gambar juga bisa disisipkan di body sebagai <img>. */
  imageUrl?: string | null;
}

/** Statistik per soal (dari backend jika ada). GET /admin/tryouts/:id/questions/:qid/stats atau field stats pada question. */
export interface QuestionStats {
  participantsCount?: number;
  answeredCount?: number;
  correctCount?: number;
  wrongCount?: number;
  correctPercent?: number;
  wrongPercent?: number;
}

/** Satu entri statistik soal dalam response bulk GET /admin/tryouts/:id/questions/stats */
export interface QuestionStatsItem {
  questionId: string;
  answeredCount?: number;
  correctCount?: number;
  wrongCount?: number;
  correctPercent?: number;
  wrongPercent?: number;
}

/** Response GET /admin/tryouts/:tryoutId/questions/stats (statistik semua soal sekaligus) */
export interface TryoutQuestionStatsBulkResponse {
  participantsCount?: number;
  questions: QuestionStatsItem[];
}

// --- Attempts ---
export interface PutAnswerRequest {
  answerText?: string | null;
  selectedOption?: string | null;
  isMarked?: boolean;
}

export interface AttemptFeedback {
  summary?: string | null;
  recap?: string | null;
  strengthAreas?: string[] | null;
  improvementAreas?: string[] | null;
  recommendationText?: string | null;
}

export interface SubmitAttemptResponse {
  attemptId: string;
  score: number;
  percentile: number;
  feedback: AttemptFeedback;
}

export interface Attempt {
  id: string;
  userId: string;
  tryoutSessionId: string;
  startedAt: string;
  submittedAt: string | null;
  status: "in_progress" | "submitted" | "expired";
  score: number | null;
  maxScore: number | null;
  percentile: number | null;
  timeSecondsSpent: number | null;
}

/** Satu soal dalam review attempt (jawaban benar/salah). */
export interface AttemptReviewItem {
  questionId: string;
  body: string;
  type?: string;
  options?: string[] | null;
  correctAnswer?: string | null;
  userAnswer?: string | null;
  isCorrect?: boolean;
  sortOrder?: number;
  imageUrl?: string | null;
}

export interface AttemptReviewResponse {
  items?: AttemptReviewItem[];
  questions?: AttemptReviewItem[];
}

export interface Certificate {
  id: string;
  userId: string;
  tryoutSessionId: string | null;
  courseId: string | null;
  issuedAt: string;
}

// --- Dashboard umum (GET /dashboard) ---
/** Satu entri leaderboard dari API (rank, userName, schoolName, bestScore, hasAttempt). */
export interface LeaderboardEntry {
  rank?: number;
  userId?: string;
  userName?: string;
  name?: string;
  nama?: string;
  schoolName?: string;
  score?: number;
  skor?: number;
  bestScore?: number;
  hasAttempt?: boolean;
  tryoutTitle?: string;
  tryoutId?: string;
  [key: string]: unknown;
}

/** Response GET /api/v1/dashboard (dashboard umum). Bisa berisi leaderboard. */
export interface DashboardResponse {
  leaderboard?: LeaderboardEntry[];
  [key: string]: unknown;
}

// --- Student dashboard ---
export interface StudentDashboardSummary {
  totalAttempts: number;
  avgScore: number;
  avgPercentile: number;
}

/** Nama siswa dari DB bisa dikembalikan di dashboard sebagai user/student.name atau user/student.nama.
 * Backend bisa mengirim strengthAreas/kekuatan, improvementAreas/perlu_ditingkatkan, recommendation/rekomendasi. */
export interface StudentDashboardResponse {
  summary: StudentDashboardSummary;
  openTryouts: TryoutSession[];
  recentAttempts: (Attempt & { tryoutTitle?: string })[];
  strengthAreas: string[];
  improvementAreas: string[];
  recommendation: string;
  user?: { name?: string; nama?: string };
  student?: { name?: string; nama?: string };
  /** Tanggal expired akses/langganan siswa (ISO string). Jika ada dan sudah lewat, frontend akan logout & redirect ke login. */
  expiresAt?: string;
}

// --- Subjects (Bidang) ---
export interface Subject {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  sortOrder?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

// --- Courses ---
export interface Course {
  id: string;
  title: string;
  description?: string | null;
  createdBy: string | null;
  subjectId?: string | null;
  sortOrder?: number | null;
}

export interface CourseEnrollment {
  id: string;
  userId: string;
  courseId: string;
  status: "enrolled" | "in_progress" | "completed";
  enrolledAt: string;
  completedAt: string | null;
}

// --- Master Data Sekolah ---
export interface Sekolah {
  id: string;
  namaSekolah: string;
  npsn?: string | null;
  kabupatenKota?: string | null;
  telepon?: string | null;
  alamat?: string | null;
}

// --- Admin ---
/** Response GET /admin/overview. Backend bisa mengembalikan field dengan nama lain. */
export interface AdminOverviewResponse {
  totalStudents?: number;
  activeTryouts?: number;
  avgScore?: number;
  totalCertificates?: number;
  /** Nama alternatif dari backend (legacy) */
  totalStudent?: number;
  totalCertificate?: number;
  activeTryout?: number;
  averageScore?: number;
}

export interface AdminCreateTryoutRequest {
  title: string;
  shortTitle?: string | null;
  description?: string | null;
  durationMinutes: number;
  questionsCount: number;
  level: TryoutLevel;
  opensAt: string;
  closesAt: string;
  maxParticipants?: number | null;
  status?: TryoutStatus;
  /** Kategori event: tryout, free_class, paid_class. */
  eventCategory?: EventCategorySlug | string | null;
}

export interface AdminCreateQuestionRequest {
  sortOrder: number;
  type: QuestionType;
  body: string;
  options?: string[] | null;
  maxScore?: number;
}

export interface AdminCreateCourseRequest {
  title: string;
  description?: string | null;
  subjectId?: string | null;
  sortOrder?: number | null;
}

export interface AdminCreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: "student" | "trainer";
  subjectId?: string | null;
  schoolId?: string | null;
}

export interface AdminUpdateUserRequest {
  name?: string;
  email?: string;
  password?: string;
  role?: "student" | "trainer" | "admin";
  subjectId?: string | null;
  schoolId?: string | null;
}

// --- Landing packages (public + admin landing manage) ---
export type LandingPackage = {
  id: string;
  name: string;
  slug?: string | null;
  shortDescription?: string | null;
  priceEarlyBird?: number | null;
  priceNormal?: number | null;
  isOpen?: boolean | null;
  isBundle?: boolean | null;
  durasi?: string | null;
  materi?: string[] | null;
  fasilitas?: string[] | null;
  bonus?: string[] | null;
  /** Dari backend publik bisa berupa objek course lengkap, admin bisa hanya ids. */
  linkedCourses?: unknown[] | null;
  linkedCourseIds?: string[] | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type AdminLandingPackageCreateRequest = {
  name: string;
  slug: string;
  shortDescription?: string;
  priceEarlyBird?: number;
  priceNormal?: number;
  isOpen?: boolean;
  isBundle?: boolean;
  durasi?: string;
  materi?: string[];
  fasilitas?: string[];
  bonus?: string[];
  linkedCourseIds?: string[];
};

export type AdminLandingPackageUpdateRequest = Partial<AdminLandingPackageCreateRequest>;

export interface AdminCreateSubjectRequest {
  name: string;
  slug?: string | null;
  description?: string | null;
  sortOrder?: number | null;
  levelId?: string | null;
}

export interface AdminIssueCertificateRequest {
  userId: string;
  tryoutSessionId?: string | null;
  courseId?: string | null;
}

// --- Admin Tryout Analysis ---
/** Analisis & grafik per tryout (per soal). GET /admin/tryouts/:tryoutId/analysis */
export interface AdminTryoutAnalysis {
  tryoutId?: string;
  questions?: Array<{
    questionId?: string;
    sortOrder?: number;
    answeredCount?: number;
    correctCount?: number;
    wrongCount?: number;
    correctPercent?: number;
    [key: string]: unknown;
  }>;
  participantsCount?: number;
  [key: string]: unknown;
}

/** Siswa yang submit tryout. GET /admin/tryouts/:tryoutId/students */
export interface AdminTryoutStudent {
  id?: string;
  userId?: string;
  attemptId?: string;
  name?: string;
  email?: string;
  schoolName?: string;
  score?: number;
  submittedAt?: string;
  [key: string]: unknown;
}

/** Analisis AI per attempt. GET /admin/tryouts/:tryoutId/attempts/:attemptId/ai-analysis */
export interface AdminTryoutAttemptAiAnalysis {
  attemptId?: string;
  userId?: string;
  summary?: string;
  strengthAreas?: string[];
  improvementAreas?: string[];
  recommendation?: string;
  [key: string]: unknown;
}

// --- Notifications (GET /notifications, PATCH /notifications/:id/read) ---
export interface Notification {
  id: string;
  userId?: string;
  title?: string;
  body?: string;
  readAt?: string | null;
  createdAt?: string;
  type?: string;
  [key: string]: unknown;
}

// --- Payments (user: GET /payments, POST /payments) ---
/** Status umum: pending (menunggu verifikasi), confirmed/completed (disetujui), rejected (ditolak). */
export type PaymentStatus = "pending" | "confirmed" | "completed" | "rejected" | string;

export interface Payment {
  id: string;
  userId?: string;
  /** Nama pengguna yang melakukan pembayaran (jika backend mengirim di list admin). */
  userName?: string;
  userEmail?: string;
  /** student | trainer — siapa yang membayar (untuk tampilan admin). */
  payerRole?: string;
  amountCents?: number;
  amount?: number;
  type?: string;
  status?: PaymentStatus;
  referenceId?: string | null;
  proofUrl?: string | null;
  /** Catatan admin / alasan penolakan */
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface CreatePaymentRequest {
  amountCents: number;
  type: string;
  referenceId: string;
  proofUrl?: string;
}

// --- Course messages & discussions (untuk user yang ter-enroll) ---
export interface CourseMessage {
  id: string;
  courseId?: string;
  userId?: string;
  userName?: string;
  message: string;
  createdAt?: string;
  [key: string]: unknown;
}

export interface CourseDiscussion {
  id: string;
  courseId?: string;
  userId?: string;
  title: string;
  body?: string;
  createdAt?: string;
  replyCount?: number;
  [key: string]: unknown;
}

export interface DiscussionReply {
  id: string;
  discussionId?: string;
  userId?: string;
  userName?: string;
  body: string;
  createdAt?: string;
  [key: string]: unknown;
}

/** Request buat kelas oleh trainer. POST /trainer/courses */
export interface TrainerCourseCreateRequest {
  title: string;
  description?: string | null;
}
