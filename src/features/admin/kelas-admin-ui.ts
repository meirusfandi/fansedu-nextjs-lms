/** Tipe & helper UI admin kelas + konten. Data hanya dari API; tidak ada penyimpanan browser. */

/**
 * Status kelas (tampilan & label).
 * API sering memakai `published`; form memakai `publish` agar singkat.
 */
export type ClassStatus = "draft" | "publish" | "active" | "published" | "archived";

/** Nilai yang dipakai di <select> modal edit/tambah kelas. */
export type CourseFormStatus = "draft" | "publish" | "active" | "archived";

/**
 * Map status dari API / GET course ke nilai form (select).
 * Menghindari select "kosong" saat API mengembalikan `published`.
 */
export function courseStatusFromApi(status: string | null | undefined): CourseFormStatus {
  const s = String(status ?? "draft").toLowerCase().trim();
  if (s === "published" || s === "publish") return "publish";
  if (s === "active") return "active";
  if (s === "archived") return "archived";
  return "draft";
}

/**
 * Map status form ke nilai yang dikirim ke POST/PUT `/admin/courses`
 * (backend Go biasanya mengharapkan `published`, bukan `publish`).
 */
export function courseStatusToApi(status: string): string {
  const s = String(status ?? "draft").toLowerCase().trim();
  if (s === "publish") return "published";
  if (s === "active") return "active";
  if (s === "archived") return "archived";
  return "draft";
}

/**
 * Tipe konten dalam UI formulir konten kelas.
 */
export type ContentType =
  | "module"
  | "article"
  | "quiz"
  | "zoom"
  | "recording"
  | "lesson"
  | "tryout";

/** Tipe lampiran file untuk konten bertipe module. */
export type AttachmentType = "pdf" | "docx" | "pptx" | "file";

/** Lampiran file (pdf/docx/pptx/file). */
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
    case "article":
      return "Artikel";
    case "quiz":
      return "Quiz";
    case "zoom":
      return "Link Zoom";
    case "recording":
      return "Rekaman";
    case "tryout":
      return "Tryout";
    default:
      return "Modul";
  }
}

export function contentTypeBadgeClass(type: ContentType | string): string {
  switch (type) {
    case "article":
      return "bg-blue-100 text-blue-800";
    case "quiz":
      return "bg-orange-100 text-orange-800";
    case "zoom":
      return "bg-purple-100 text-purple-800";
    case "recording":
      return "bg-red-100 text-red-800";
    case "tryout":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-emerald-100 text-emerald-800";
  }
}

export function attachmentTypeLabel(type: AttachmentType | AssetType | string): string {
  switch (type) {
    case "pdf":
      return "PDF";
    case "docx":
      return "Word (DOCX)";
    case "pptx":
      return "PowerPoint (PPTX)";
    case "video":
      return "Video";
    case "link":
      return "Link";
    default:
      return "File";
  }
}

export const emptyClassForm: {
  title: string;
  description: string;
  levelId: string;
  subjectId: string;
  trainerId: string;
  startDate: string;
  endDate: string;
  status: CourseFormStatus;
} = {
  title: "",
  description: "",
  levelId: "",
  subjectId: "",
  trainerId: "",
  startDate: "",
  endDate: "",
  status: "draft",
};

/** Status badge color untuk tampilan list kelas. */
export function statusBadgeClass(status: ClassStatus | string | null | undefined): string {
  if (status === "publish" || status === "published") return "bg-emerald-100 text-emerald-800";
  if (status === "active") return "bg-blue-100 text-blue-800";
  if (status === "archived") return "bg-zinc-100 text-zinc-600";
  return "bg-amber-100 text-amber-800";
}

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
