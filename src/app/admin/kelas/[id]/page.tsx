"use client";

import { FlashNoticeBar, useFlashNotice } from "@/components/FlashNotice";
import {
  attachmentTypeLabel,
  contentTypeBadgeClass,
  contentTypeLabel,
  emptyAttachmentForm,
  emptyContentForm,
  statusLabel,
  uid,
  type AttachmentType,
  type ClassAttachment,
  type ContentType,
} from "@/features/admin/kelas-admin-ui";
import {
  adminAddCourseContent,
  adminDeleteCourseContent,
  adminGetCourse,
  adminListCourseContents,
  adminUpdateCourseContent,
  adminUploadCourseMaterial,
  getFriendlyApiErrorMessage,
  resolveBackendUrl,
} from "@/lib/api";
import type {
  AdminCourseAttachment,
  AdminCourseContent,
  AdminCourseContentType,
  AdminUpdateCourseContentRequest,
  Course,
} from "@/lib/api-types";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

function toApiContentType(ct: ContentType): AdminCourseContentType {
  if (ct === "quiz") return "test";
  if (ct === "lesson") return "module";
  return ct as AdminCourseContentType;
}

function fromApiContentType(raw: string | null | undefined): ContentType {
  const t = String(raw ?? "").toLowerCase();
  if (t === "test") return "quiz";
  if (t === "lesson") return "module";
  if (
    t === "module" ||
    t === "article" ||
    t === "quiz" ||
    t === "zoom" ||
    t === "recording" ||
    t === "tryout"
  ) {
    return t as ContentType;
  }
  return "module";
}

function attachmentsFromApi(items: AdminCourseAttachment[] | null | undefined): ClassAttachment[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      const url = item.url != null ? String(item.url).trim() : "";
      if (!url) return null;
      const typeRaw = item.type != null ? String(item.type).toLowerCase() : "file";
      const type: AttachmentType =
        typeRaw === "pdf" || typeRaw === "docx" || typeRaw === "pptx" ? typeRaw : "file";
      return {
        id: item.id != null ? String(item.id) : uid("att"),
        type,
        name: item.name != null ? String(item.name) : "Lampiran",
        url,
      };
    })
    .filter((a): a is ClassAttachment => Boolean(a));
}

function attachmentsToApi(items: ClassAttachment[]): AdminCourseAttachment[] {
  return items.map((a) => ({
    id: a.id,
    type: a.type,
    name: a.name,
    url: a.url,
  }));
}

/** Nilai untuk input `datetime-local` dari respons API (ISO dll.). */
function scheduledAtForDatetimeLocal(apiValue: string | null | undefined): string {
  if (apiValue == null || !String(apiValue).trim()) return "";
  const d = new Date(String(apiValue));
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Kirim jadwal ke API dari isian form datetime-local. */
function scheduledAtToApi(formValue: string): string | undefined {
  const s = formValue.trim();
  if (!s) return undefined;
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d.toISOString();
  return s;
}

/**
 * Payload PUT lengkap dari baris konten saat ini.
 * Dipakai saat backend mengganti seluruh record (bukan patch), agar lampiran/type tidak hilang.
 */
function courseContentRowToFullPutBody(row: AdminCourseContent): AdminUpdateCourseContentRequest {
  const atts = attachmentsFromApi(row.attachments ?? undefined);
  const so = row.sortOrder;
  const sortOrderRaw =
    typeof so === "number" && Number.isFinite(so)
      ? so
      : so != null && String(so).trim() !== ""
        ? Number(so)
        : NaN;
  const sortOrder = Number.isFinite(sortOrderRaw) ? sortOrderRaw : undefined;
  const sched =
    row.scheduledAt != null && String(row.scheduledAt).trim()
      ? (() => {
          const d = new Date(String(row.scheduledAt));
          return !Number.isNaN(d.getTime()) ? d.toISOString() : String(row.scheduledAt).trim();
        })()
      : undefined;
  return {
    type: row.type,
    title: row.title,
    description: row.description?.trim() ? row.description : undefined,
    body: row.body?.trim() ? row.body : undefined,
    attachments: attachmentsToApi(atts),
    zoomUrl: row.zoomUrl?.trim() ? row.zoomUrl : undefined,
    zoomPassword: row.zoomPassword?.trim() ? row.zoomPassword : undefined,
    scheduledAt: sched,
    recordingUrl: row.recordingUrl?.trim() ? row.recordingUrl : undefined,
    sortOrder,
  };
}

export default function AdminKelasModulesPage() {
  const params = useParams<{ id: string }>();
  const classId = String(params?.id ?? "").trim();

  const { notice, showSuccess, clearNotice } = useFlashNotice();
  const [error, setError] = useState<string | null>(null);

  const [course, setCourse] = useState<Course | null>(null);
  const [contents, setContents] = useState<AdminCourseContent[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const loadPage = useCallback(async () => {
    if (!classId) return;
    setPageLoading(true);
    setPageError(null);
    try {
      const [c, list] = await Promise.all([
        adminGetCourse(classId),
        adminListCourseContents(classId),
      ]);
      setCourse(c);
      setContents(
        list.slice().sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0))
      );
    } catch (e) {
      setPageError(getFriendlyApiErrorMessage(e));
      setCourse(null);
      setContents([]);
    } finally {
      setPageLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  const sortedContents = useMemo(
    () =>
      contents.slice().sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0)),
    [contents]
  );

  const [contentModalOpen, setContentModalOpen] = useState(false);
  const [contentForm, setContentForm] = useState(emptyContentForm);
  const [editingContentId, setEditingContentId] = useState<string | null>(null);
  const [contentSaving, setContentSaving] = useState(false);

  const [attachmentModalOpen, setAttachmentModalOpen] = useState(false);
  const [attachmentForm, setAttachmentForm] = useState<{
    type: AttachmentType;
    name: string;
    url: string;
  }>(emptyAttachmentForm);
  const [targetContentIdForAttachment, setTargetContentIdForAttachment] = useState<string | null>(
    null
  );
  const [attachmentUploading, setAttachmentUploading] = useState(false);

  const openAddContent = () => {
    setEditingContentId(null);
    setContentForm(emptyContentForm);
    setContentModalOpen(true);
    setError(null);
  };

  const openEditContent = (contentId: string) => {
    const row = sortedContents.find((x) => x.id === contentId);
    if (!row) return;
    setEditingContentId(contentId);
    setContentForm({
      type: fromApiContentType(row.type),
      title: row.title,
      description: row.description ?? "",
      body: row.body ?? "",
      zoomUrl: row.zoomUrl ?? "",
      zoomPassword: row.zoomPassword ?? "",
      scheduledAt: scheduledAtForDatetimeLocal(row.scheduledAt ?? ""),
      recordingUrl: row.recordingUrl ?? "",
    });
    setContentModalOpen(true);
    setError(null);
  };

  const handleSaveContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId || !contentForm.title.trim()) {
      setError("Judul konten wajib diisi.");
      return;
    }
    if (contentForm.type === "zoom" && !contentForm.zoomUrl.trim()) {
      setError("URL Zoom wajib diisi.");
      return;
    }
    if (contentForm.type === "recording" && !contentForm.recordingUrl.trim()) {
      setError("URL rekaman wajib diisi.");
      return;
    }

    setContentSaving(true);
    setError(null);

    try {
      const apiType = toApiContentType(contentForm.type);
      const patch: AdminUpdateCourseContentRequest = {
        type: apiType,
        title: contentForm.title.trim(),
        description: contentForm.description.trim() || undefined,
        body: contentForm.body.trim() || undefined,
        zoomUrl: contentForm.zoomUrl.trim() || undefined,
        zoomPassword: contentForm.zoomPassword.trim() || undefined,
        scheduledAt: scheduledAtToApi(contentForm.scheduledAt),
        recordingUrl: contentForm.recordingUrl.trim() || undefined,
      };

      if (editingContentId) {
        const row = sortedContents.find((x) => x.id === editingContentId);
        if (!row) {
          setError("Konten tidak ditemukan. Muat ulang halaman.");
        } else {
          await adminUpdateCourseContent(classId, editingContentId, {
            ...courseContentRowToFullPutBody(row),
            ...patch,
          });
          showSuccess("Konten berhasil diperbarui.");
          await loadPage();
          setContentModalOpen(false);
          setEditingContentId(null);
        }
      } else {
        const maxOrder = sortedContents.reduce(
          (m, x) => Math.max(m, Number(x.sortOrder ?? 0)),
          0
        );
        await adminAddCourseContent(classId, {
          ...patch,
          sortOrder: maxOrder + 1,
        });
        showSuccess("Konten berhasil ditambahkan.");
        await loadPage();
        setContentModalOpen(false);
        setEditingContentId(null);
      }
    } catch (err) {
      setError(getFriendlyApiErrorMessage(err));
    }

    setContentSaving(false);
  };

  const removeContent = async (contentId: string) => {
    if (!confirm("Hapus konten ini?")) return;
    try {
      await adminDeleteCourseContent(classId, contentId);
      await loadPage();
      showSuccess("Konten berhasil dihapus.");
    } catch (err) {
      setError(getFriendlyApiErrorMessage(err));
    }
  };

  const openAddAttachment = (contentId: string) => {
    setTargetContentIdForAttachment(contentId);
    setAttachmentForm(emptyAttachmentForm);
    setAttachmentModalOpen(true);
    setError(null);
  };

  const detectAttachmentTypeFromFile = (file: File): AttachmentType => {
    const lower = file.name.toLowerCase();
    if (lower.endsWith(".pdf")) return "pdf";
    if (lower.endsWith(".doc") || lower.endsWith(".docx")) return "docx";
    if (lower.endsWith(".ppt") || lower.endsWith(".pptx")) return "pptx";
    return "file";
  };

  const handleUploadAttachmentFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!classId || !targetContentIdForAttachment) {
      setError("Konten lampiran tidak valid.");
      e.target.value = "";
      return;
    }

    setAttachmentUploading(true);
    setError(null);

    try {
      const uploaded = await adminUploadCourseMaterial(file);
      const uploadedUrl = typeof uploaded?.url === "string" ? uploaded.url.trim() : "";
      if (!uploadedUrl) {
        throw new Error("Upload tidak mengembalikan URL file.");
      }

      setAttachmentForm((f) => ({
        ...f,
        type: detectAttachmentTypeFromFile(file),
        name: f.name.trim() || String(uploaded.filename ?? file.name),
        url: uploadedUrl,
      }));

      showSuccess("File berhasil di-upload. Klik Simpan untuk menambahkan lampiran.");
    } catch (err) {
      setError(getFriendlyApiErrorMessage(err));
    } finally {
      setAttachmentUploading(false);
      e.target.value = "";
    }
  };

  const handleSaveAttachment = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (attachmentUploading) {
      setError("Tunggu proses upload selesai.");
      return;
    }
    if (
      !classId ||
      !targetContentIdForAttachment ||
      !attachmentForm.name.trim() ||
      !attachmentForm.url.trim()
    ) {
      setError("Nama lampiran dan URL wajib diisi.");
      return;
    }

    const target = sortedContents.find((x) => x.id === targetContentIdForAttachment);
    if (!target) {
      setError("Konten tidak ditemukan.");
      return;
    }
    const existing = attachmentsFromApi(target.attachments ?? undefined);
    const newAttachment: ClassAttachment = {
      id: uid("att"),
      type: attachmentForm.type,
      name: attachmentForm.name.trim(),
      url: attachmentForm.url.trim(),
    };

    try {
      await adminUpdateCourseContent(classId, targetContentIdForAttachment, {
        ...courseContentRowToFullPutBody(target),
        attachments: attachmentsToApi([...existing, newAttachment]),
      });
      await loadPage();
      setAttachmentModalOpen(false);
      setError(null);
      showSuccess("Lampiran berhasil ditambahkan.");
    } catch (err) {
      setError(getFriendlyApiErrorMessage(err));
    }
  };

  const removeAttachment = async (contentId: string, attachmentId: string) => {
    const target = sortedContents.find((x) => x.id === contentId);
    if (!target) {
      setError("Konten tidak ditemukan.");
      return;
    }
    const existing = attachmentsFromApi(target.attachments ?? undefined);
    const next = existing.filter((a) => a.id !== attachmentId);
    try {
      await adminUpdateCourseContent(classId, contentId, {
        ...courseContentRowToFullPutBody(target),
        attachments: attachmentsToApi(next),
      });
      await loadPage();
      showSuccess("Lampiran berhasil dihapus.");
    } catch (err) {
      setError(getFriendlyApiErrorMessage(err));
    }
  };

  if (!classId) {
    return (
      <div className="px-4 py-8 text-center text-sm text-red-600">
        ID tidak valid.{" "}
        <Link href="/admin/kelas" className="underline">
          Kembali
        </Link>
      </div>
    );
  }

  if (pageLoading) {
    return (
      <div className="px-4 py-12 text-center text-sm text-zinc-500">Memuat data kelas…</div>
    );
  }

  if (pageError || !course) {
    return (
      <div className="px-4 py-8 text-center text-sm">
        <p className="text-red-600">{pageError ?? "Kelas tidak ditemukan."}</p>
        <Link href="/admin/kelas" className="mt-3 inline-block font-medium text-emerald-700 underline">
          Ke daftar kelas
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 py-5 sm:px-6 md:px-8 md:py-8">
      {notice && (
        <div className="mb-4">
          <FlashNoticeBar kind={notice.kind} message={notice.text} onDismiss={clearNotice} />
        </div>
      )}
      <Link
        href="/admin/kelas"
        className="text-sm font-medium text-zinc-600 underline decoration-zinc-300 underline-offset-2 hover:text-zinc-900"
      >
        ← Kembali ke daftar kelas
      </Link>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Management Kelas
        </p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
          Konten: {course.title}
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          {course.description ?? "Tanpa deskripsi"} · {statusLabel(course.status)}
        </p>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
        <p className="text-sm font-medium text-zinc-800">
          Konten materi (tersimpan di server, urut berdasarkan sort order)
        </p>
        <button
          type="button"
          onClick={openAddContent}
          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
        >
          + Tambah konten
        </button>
      </div>

      <div className="mt-4 space-y-4">
        {sortedContents.length === 0 ? (
          <p className="text-sm text-zinc-600">Belum ada konten dalam kelas ini.</p>
        ) : (
          sortedContents.map((x, idx) => {
            const ct = fromApiContentType(x.type);
            const atts = attachmentsFromApi(x.attachments ?? undefined);
            return (
              <div key={x.id} className="rounded-xl border border-zinc-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-zinc-100 px-3 py-2">
                  <div>
                    <p className="font-medium text-zinc-900">
                      #{idx + 1} · {x.title}
                    </p>
                    {x.description ? (
                      <p className="text-xs text-zinc-500">{x.description}</p>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEditContent(x.id)}
                      className="rounded border border-zinc-200 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => removeContent(x.id)}
                      className="rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
                <div className="space-y-2 p-3">
                  <div className="rounded-lg border border-zinc-100 bg-zinc-50/50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${contentTypeBadgeClass(ct)}`}
                          >
                            {contentTypeLabel(ct)}
                          </span>
                          <span className="text-sm font-medium text-zinc-900">{x.title}</span>
                        </div>
                        {x.description && (
                          <p className="mt-0.5 text-xs text-zinc-500">{x.description}</p>
                        )}

                        {(ct === "module" || ct === "lesson") && x.body && (
                          <p className="mt-1 line-clamp-2 text-xs text-zinc-600">{x.body}</p>
                        )}
                        {ct === "article" && x.body && (
                          <p className="mt-1 line-clamp-2 text-xs text-zinc-600">{x.body}</p>
                        )}
                        {ct === "quiz" && x.body && (
                          <p className="mt-1 line-clamp-2 text-xs text-zinc-600">{x.body}</p>
                        )}
                        {ct === "zoom" && (
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                            {x.zoomUrl && (
                              <a
                                href={resolveBackendUrl(x.zoomUrl)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-purple-700 underline underline-offset-1 hover:text-purple-900"
                              >
                                Buka Zoom
                              </a>
                            )}
                            {x.zoomPassword && (
                              <span className="rounded bg-purple-100 px-1.5 py-0.5 text-purple-700">
                                Password: {x.zoomPassword}
                              </span>
                            )}
                            {x.scheduledAt && (
                              <span className="text-zinc-500">
                                {new Date(x.scheduledAt).toLocaleString("id-ID", {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                })}
                              </span>
                            )}
                          </div>
                        )}
                        {ct === "recording" && (
                          <div className="mt-1 text-xs">
                            {x.recordingUrl && (
                              <a
                                href={resolveBackendUrl(x.recordingUrl)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-red-700 underline underline-offset-1 hover:text-red-900"
                              >
                                Tonton Rekaman
                              </a>
                            )}
                          </div>
                        )}

                        {(ct === "module" || ct === "lesson") && atts.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {atts.map((a) => (
                              <div
                                key={a.id}
                                className="flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-xs text-zinc-700"
                              >
                                <span className="font-medium text-zinc-500">
                                  {attachmentTypeLabel(a.type)}
                                </span>
                                <a
                                  href={resolveBackendUrl(a.url)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="max-w-[120px] truncate text-zinc-800 hover:underline"
                                >
                                  {a.name}
                                </a>
                                <button
                                  type="button"
                                  onClick={() => removeAttachment(x.id, a.id)}
                                  className="text-red-400 hover:text-red-600"
                                  title="Hapus lampiran"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex shrink-0 gap-2">
                        {(ct === "module" || ct === "lesson") && (
                          <button
                            type="button"
                            onClick={() => openAddAttachment(x.id)}
                            className="rounded border border-zinc-200 px-2 py-1 text-xs text-zinc-700 hover:bg-white"
                          >
                            + Lampiran
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {contentModalOpen && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-zinc-900">
              {editingContentId ? "Edit Konten" : "Tambah Konten"}
            </h3>
            <form onSubmit={handleSaveContent} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-600">Tipe *</label>
                <select
                  value={contentForm.type}
                  onChange={(e) =>
                    setContentForm((f) => ({ ...f, type: e.target.value as ContentType }))
                  }
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                >
                  <option value="module">Modul (teks + lampiran)</option>
                  <option value="article">Artikel</option>
                  <option value="quiz">Quiz</option>
                  <option value="zoom">Link Zoom</option>
                  <option value="recording">Rekaman</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">Judul *</label>
                <input
                  required
                  value={contentForm.title}
                  onChange={(e) => setContentForm((f) => ({ ...f, title: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">Deskripsi</label>
                <textarea
                  rows={2}
                  value={contentForm.description}
                  onChange={(e) => setContentForm((f) => ({ ...f, description: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                />
              </div>

              {(contentForm.type === "module" ||
                contentForm.type === "article" ||
                contentForm.type === "quiz") && (
                <div>
                  <label className="block text-xs font-medium text-zinc-600">
                    {contentForm.type === "quiz"
                      ? "Deskripsi / petunjuk (opsional)"
                      : "Isi / Materi"}
                  </label>
                  <textarea
                    rows={contentForm.type === "quiz" ? 3 : 5}
                    value={contentForm.body}
                    onChange={(e) => setContentForm((f) => ({ ...f, body: e.target.value }))}
                    placeholder={
                      contentForm.type === "quiz"
                        ? "Ringkasan atau petunjuk pengerjaan kuis…"
                        : "Tulis isi materi di sini…"
                    }
                    className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                  />
                </div>
              )}

              {contentForm.type === "zoom" && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-zinc-600">URL Meeting Zoom *</label>
                    <input
                      required
                      value={contentForm.zoomUrl}
                      onChange={(e) => setContentForm((f) => ({ ...f, zoomUrl: e.target.value }))}
                      placeholder="https://zoom.us/j/..."
                      className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-600">Password Zoom</label>
                    <input
                      value={contentForm.zoomPassword}
                      onChange={(e) =>
                        setContentForm((f) => ({ ...f, zoomPassword: e.target.value }))
                      }
                      placeholder="Opsional"
                      className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-600">Jadwal sesi</label>
                    <input
                      type="datetime-local"
                      value={contentForm.scheduledAt}
                      onChange={(e) =>
                        setContentForm((f) => ({ ...f, scheduledAt: e.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                    />
                  </div>
                </>
              )}

              {contentForm.type === "recording" && (
                <div>
                  <label className="block text-xs font-medium text-zinc-600">URL Rekaman *</label>
                  <input
                    required
                    value={contentForm.recordingUrl}
                    onChange={(e) =>
                      setContentForm((f) => ({ ...f, recordingUrl: e.target.value }))
                    }
                    placeholder="https://..."
                    className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setContentModalOpen(false);
                    setEditingContentId(null);
                  }}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={contentSaving}
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-60"
                >
                  {contentSaving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {attachmentModalOpen && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-zinc-900">Tambah Lampiran</h3>
            <form onSubmit={handleSaveAttachment} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-600">Tipe file *</label>
                <select
                  value={attachmentForm.type}
                  onChange={(e) =>
                    setAttachmentForm((f) => ({ ...f, type: e.target.value as AttachmentType }))
                  }
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                >
                  <option value="pdf">PDF</option>
                  <option value="docx">Word (DOCX)</option>
                  <option value="pptx">PowerPoint (PPTX)</option>
                  <option value="file">File lain</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">Nama lampiran *</label>
                <input
                  required
                  value={attachmentForm.name}
                  onChange={(e) => setAttachmentForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Contoh: Modul 1 – Ringkasan"
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">Upload berkas (PDF/DOC/PPT)</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                  onChange={handleUploadAttachmentFile}
                  disabled={attachmentUploading}
                  className="mt-1 block w-full text-xs text-zinc-700 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-zinc-700 hover:file:bg-zinc-200 disabled:opacity-60"
                />
                <p className="mt-1 text-[11px] text-zinc-500">
                  Setelah upload berhasil, tipe, nama, dan URL akan terisi otomatis.
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">URL / path file *</label>
                <input
                  required
                  value={attachmentForm.url}
                  onChange={(e) => setAttachmentForm((f) => ({ ...f, url: e.target.value }))}
                  placeholder="https://... atau /uploads/..."
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAttachmentModalOpen(false)}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={attachmentUploading}
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-60"
                >
                  {attachmentUploading ? "Mengunggah..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
