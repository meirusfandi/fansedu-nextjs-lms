/** Model kelas admin — metadata di backend, modules/extras di localStorage per courseId. */

/**
 * Status kelas.
 * Nilai backend: draft | publish | active
 * Nilai lama (backward-compat): published | archived
 */
export type ClassStatus = "draft" | "publish" | "active" | "published" | "archived";

/**
 * Tipe konten dalam module kelas.
 * "lesson" dan "tryout" dipertahankan untuk backward-compat data lama.
 */
export type ContentType =
  | "module"    // Materi teks + lampiran (pdf/docx/pptx)
  | "article"   // Artikel panjang (teks)
  | "quiz"      // Quiz
  | "zoom"      // Link sesi Zoom
  | "recording" // Link rekaman
  | "lesson"    // @deprecated → setara module
  | "tryout";   // @deprecated

/** Tipe lampiran file untuk konten bertipe module. */
export type AttachmentType = "pdf" | "docx" | "pptx" | "file";

/** Lampiran file (pdf/docx/pptx/file) untuk konten module. */
export type ClassAttachment = {
  id: string;
  type: AttachmentType;
  name: string;
  url: string;
};

/** @deprecated — dipertahankan untuk backward-compat data lama. */
export type AssetType = "video" | "pdf" | "file" | "link" | "docx" | "pptx";

/** @deprecated — dipertahankan untuk backward-compat data lama. */
export type ClassAsset = {
  id: string;
  type: AssetType;
  title: string;
  url: string;
};

export type ClassContent = {
  id: string;
  /** ID dari backend (/admin/courses/:id/contents). Set setelah sync ke server. */
  backendId?: string;
  type: ContentType;
  title: string;
  description?: string;
  /** Isi teks (plain/markdown) untuk tipe module dan article. */
  body?: string;
  /** Lampiran file untuk tipe module (pdf, docx, pptx). */
  attachments?: ClassAttachment[];
  /** URL meeting Zoom untuk tipe zoom. */
  zoomUrl?: string;
  /** Password Zoom (opsional). */
  zoomPassword?: string;
  /** Jadwal sesi (ISO string) untuk tipe zoom. */
  scheduledAt?: string;
  /** URL rekaman untuk tipe recording. */
  recordingUrl?: string;
  /** @deprecated — dipertahankan untuk backward-compat data lama. */
  assets?: ClassAsset[];
};

export type ClassModule = {
  id: string;
  title: string;
  description?: string;
  order: number;
  contents: ClassContent[];
};

export type AdminClass = {
  id: string;
  title: string;
  description?: string;
  subjectId?: string;
  subjectName?: string;
  levelId?: string;
  levelName?: string;
  trainerId?: string;
  trainerName?: string;
  startDate?: string;
  endDate?: string;
  status: ClassStatus;
  modules: ClassModule[];
  createdAt: string;
  updatedAt: string;
};

/** Data lokal per courseId: extra fields + modules (disimpan di localStorage). */
export type AdminClassExtra = {
  levelId?: string;
  levelName?: string;
  subjectName?: string;
  trainerId?: string;
  trainerName?: string;
  startDate?: string;
  endDate?: string;
  modules: ClassModule[];
};

/** Key localStorage lama — dipertahankan untuk migrasi/fallback. */
export const LOCAL_ADMIN_CLASSES_KEY = "fansedu_admin_classes_v2";
/** Key localStorage baru — extras & modules per courseId dari backend. */
export const COURSE_EXTRAS_KEY = "fansedu_course_extras_v1";

export function loadCourseExtras(): Record<string, AdminClassExtra> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(COURSE_EXTRAS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, AdminClassExtra>;
  } catch {
    return {};
  }
}

export function saveCourseExtras(extras: Record<string, AdminClassExtra>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(COURSE_EXTRAS_KEY, JSON.stringify(extras));
  } catch { /* quota / private mode */ }
}

export function uid(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function statusLabel(status: ClassStatus | string | null | undefined): string {
  if (status === "publish" || status === "published") return "Published";
  if (status === "active") return "Aktif";
  if (status === "archived") return "Archived";
  return "Draft";
}

export function contentTypeLabel(type: ContentType | string): string {
  switch (type) {
    case "article": return "Artikel";
    case "quiz": return "Quiz";
    case "zoom": return "Link Zoom";
    case "recording": return "Rekaman";
    case "tryout": return "Tryout";
    default: return "Modul"; // module | lesson
  }
}

export function contentTypeBadgeClass(type: ContentType | string): string {
  switch (type) {
    case "article": return "bg-blue-100 text-blue-800";
    case "quiz": return "bg-orange-100 text-orange-800";
    case "zoom": return "bg-purple-100 text-purple-800";
    case "recording": return "bg-red-100 text-red-800";
    case "tryout": return "bg-yellow-100 text-yellow-800";
    default: return "bg-emerald-100 text-emerald-800"; // module | lesson
  }
}

export function attachmentTypeLabel(type: AttachmentType | AssetType | string): string {
  switch (type) {
    case "pdf": return "PDF";
    case "docx": return "Word (DOCX)";
    case "pptx": return "PowerPoint (PPTX)";
    case "video": return "Video";
    case "link": return "Link";
    default: return "File";
  }
}

export const emptyClassForm = {
  title: "",
  description: "",
  levelId: "",
  subjectId: "",
  trainerId: "",
  startDate: "",
  endDate: "",
  status: "draft" as ClassStatus,
};

/** Status badge color untuk tampilan list kelas. */
export function statusBadgeClass(status: ClassStatus | string | null | undefined): string {
  if (status === "publish" || status === "published") return "bg-emerald-100 text-emerald-800";
  if (status === "active") return "bg-blue-100 text-blue-800";
  if (status === "archived") return "bg-zinc-100 text-zinc-600";
  return "bg-amber-100 text-amber-800"; // draft
}

export const emptyModuleForm = { title: "", description: "" };

export const emptyContentForm = {
  type: "module" as ContentType,
  title: "",
  description: "",
  body: "",
  zoomUrl: "",
  zoomPassword: "",
  scheduledAt: "",
  recordingUrl: "",
};

export const emptyAttachmentForm = {
  type: "pdf" as AttachmentType,
  name: "",
  url: "",
};

/** @deprecated Gunakan emptyAttachmentForm. */
export const emptyAssetForm = { type: "video" as AssetType, title: "", url: "" };
