/** Model kelas admin (localStorage) — terpisah dari kelas API Master Data. */

export type ClassStatus = "draft" | "published" | "archived";
export type ContentType = "lesson" | "quiz" | "tryout";
export type AssetType = "video" | "pdf" | "file" | "link";

export type ClassAsset = {
  id: string;
  type: AssetType;
  title: string;
  url: string;
};

export type ClassContent = {
  id: string;
  type: ContentType;
  title: string;
  description?: string;
  assets: ClassAsset[];
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
  trainerId?: string;
  trainerName?: string;
  startDate?: string;
  endDate?: string;
  status: ClassStatus;
  modules: ClassModule[];
  createdAt: string;
  updatedAt: string;
};

export const LOCAL_ADMIN_CLASSES_KEY = "fansedu_admin_classes_v2";

export function uid(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function statusLabel(status: ClassStatus): string {
  if (status === "published") return "Published";
  if (status === "archived") return "Archived";
  return "Draft";
}

export function contentTypeLabel(type: ContentType): string {
  if (type === "quiz") return "Quiz";
  if (type === "tryout") return "Tryout";
  return "Module";
}

export function assetTypeLabel(type: AssetType): string {
  if (type === "pdf") return "PDF";
  if (type === "file") return "File";
  if (type === "video") return "Video";
  return "Link";
}

export const emptyClassForm = {
  title: "",
  description: "",
  trainerId: "",
  startDate: "",
  endDate: "",
  status: "draft" as ClassStatus,
};

export const emptyModuleForm = { title: "", description: "" };
export const emptyContentForm = { type: "lesson" as ContentType, title: "", description: "" };
export const emptyAssetForm = { type: "video" as AssetType, title: "", url: "" };
