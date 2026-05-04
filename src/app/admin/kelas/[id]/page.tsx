"use client";

import { FlashNoticeBar, useFlashNotice } from "@/components/FlashNotice";
import {
  attachmentTypeLabel,
  contentTypeBadgeClass,
  contentTypeLabel,
  emptyAttachmentForm,
  emptyContentForm,
  emptyModuleForm,
  nowIso,
  statusLabel,
  uid,
  type AttachmentType,
  type ClassAttachment,
  type ContentType,
} from "@/features/admin/local-kelas-storage";
import { useAdminLocalClasses } from "@/features/admin/useAdminLocalClasses";
import {
  adminAddCourseContent,
  adminDeleteCourseContent,
  adminListCourseContents,
  adminUpdateCourseContent,
} from "@/lib/api";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function AdminKelasModulesPage() {
  const params = useParams<{ id: string }>();
  const classId = String(params?.id ?? "").trim();

  const { classes, setClasses, hydrated } = useAdminLocalClasses();
  const { notice, showSuccess, clearNotice } = useFlashNotice();
  const [error, setError] = useState<string | null>(null);

  const selectedClass = useMemo(
    () => classes.find((c) => c.id === classId) ?? null,
    [classes, classId]
  );

  // --- Module modal ---
  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [moduleForm, setModuleForm] = useState(emptyModuleForm);

  // --- Content modal ---
  const [contentModalOpen, setContentModalOpen] = useState(false);
  const [contentForm, setContentForm] = useState(emptyContentForm);
  const [targetModuleId, setTargetModuleId] = useState<string | null>(null);
  const [editingContentId, setEditingContentId] = useState<string | null>(null);
  const [contentSaving, setContentSaving] = useState(false);

  // --- Attachment modal (only for "module" type content) ---
  const [attachmentModalOpen, setAttachmentModalOpen] = useState(false);
  const [attachmentForm, setAttachmentForm] = useState<{
    type: AttachmentType;
    name: string;
    url: string;
  }>(emptyAttachmentForm);
  const [targetContentIdForAttachment, setTargetContentIdForAttachment] = useState<string | null>(null);

  // =================== Backend sync on load ===================

  /**
   * Saat halaman dimuat (setelah hook hydrated), sinkronisasi konten dari
   * backend ke localStorage. Konten yang sudah ada di lokal tapi tidak di
   * backend akan tetap dipertahankan (offline-first).
   */
  const syncFromBackend = useCallback(async () => {
    if (!classId || !hydrated) return;
    try {
      const backendContents = await adminListCourseContents(classId);
      if (backendContents.length === 0) return;

      setClasses((prev) =>
        prev.map((c) => {
          if (c.id !== classId) return c;

          // Buat map backendId → content untuk cepat lookup
          const backendById = new Map(backendContents.map((bc) => [bc.id, bc]));

          // Update backendId pada konten lokal yang sudah ada
          const updatedModules = c.modules.map((m) => ({
            ...m,
            contents: m.contents.map((x) => {
              if (x.backendId && backendById.has(x.backendId)) return x;
              // Coba cocokkan berdasarkan title + type (untuk konten tanpa backendId)
              const match = backendContents.find(
                (bc) => bc.title === x.title && bc.type === x.type && !x.backendId
              );
              return match ? { ...x, backendId: match.id } : x;
            }),
          }));

          return { ...c, modules: updatedModules };
        })
      );
    } catch {
      // Sync gagal silently — data lokal tetap valid
    }
  }, [classId, hydrated, setClasses]);

  useEffect(() => {
    syncFromBackend();
    // Hanya jalankan saat hydrated berubah ke true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // =================== Module handlers ===================

  const openAddModule = () => {
    setModuleForm(emptyModuleForm);
    setModuleModalOpen(true);
    setError(null);
  };

  const handleSaveModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId || !moduleForm.title.trim()) {
      setError("Judul module wajib diisi.");
      return;
    }
    setClasses((prev) =>
      prev.map((c) => {
        if (c.id !== classId) return c;
        const nextOrder = c.modules.length + 1;
        return {
          ...c,
          modules: [
            ...c.modules,
            {
              id: uid("mod"),
              title: moduleForm.title.trim(),
              description: moduleForm.description.trim() || undefined,
              order: nextOrder,
              contents: [],
            },
          ],
          updatedAt: nowIso(),
        };
      })
    );
    setModuleModalOpen(false);
    setError(null);
    showSuccess("Modul berhasil ditambahkan.");
  };

  const removeModule = (moduleId: string) => {
    if (!confirm("Hapus module ini beserta semua kontennya?")) return;
    setClasses((prev) =>
      prev.map((c) =>
        c.id === classId
          ? { ...c, modules: c.modules.filter((m) => m.id !== moduleId), updatedAt: nowIso() }
          : c
      )
    );
    showSuccess("Modul berhasil dihapus.");
  };

  // =================== Content handlers ===================

  const openAddContent = (moduleId: string) => {
    setTargetModuleId(moduleId);
    setEditingContentId(null);
    setContentForm(emptyContentForm);
    setContentModalOpen(true);
    setError(null);
  };

  const openEditContent = (moduleId: string, contentId: string) => {
    const mod = selectedClass?.modules.find((m) => m.id === moduleId);
    const content = mod?.contents.find((x) => x.id === contentId);
    if (!content) return;
    setTargetModuleId(moduleId);
    setEditingContentId(contentId);
    setContentForm({
      type: content.type as ContentType,
      title: content.title,
      description: content.description ?? "",
      body: content.body ?? "",
      zoomUrl: content.zoomUrl ?? "",
      zoomPassword: content.zoomPassword ?? "",
      scheduledAt: content.scheduledAt ?? "",
      recordingUrl: content.recordingUrl ?? "",
    });
    setContentModalOpen(true);
    setError(null);
  };

  const handleSaveContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId || !targetModuleId || !contentForm.title.trim()) {
      setError("Judul konten wajib diisi.");
      return;
    }

    setContentSaving(true);
    setError(null);

    if (editingContentId) {
      const existingContent = selectedClass?.modules
        .flatMap((m) => m.contents)
        .find((x) => x.id === editingContentId);

      setClasses((prev) =>
        prev.map((c) => {
          if (c.id !== classId) return c;
          return {
            ...c,
            modules: c.modules.map((m) =>
              m.id === targetModuleId
                ? {
                    ...m,
                    contents: m.contents.map((x) =>
                      x.id === editingContentId
                        ? {
                            ...x,
                            type: contentForm.type,
                            title: contentForm.title.trim(),
                            description: contentForm.description.trim() || undefined,
                            body: contentForm.body.trim() || undefined,
                            zoomUrl: contentForm.zoomUrl.trim() || undefined,
                            zoomPassword: contentForm.zoomPassword.trim() || undefined,
                            scheduledAt: contentForm.scheduledAt.trim() || undefined,
                            recordingUrl: contentForm.recordingUrl.trim() || undefined,
                          }
                        : x
                    ),
                  }
                : m
            ),
            updatedAt: nowIso(),
          };
        })
      );

      if (existingContent?.backendId) {
        try {
          await adminUpdateCourseContent(classId, existingContent.backendId, {
            type: contentForm.type,
            title: contentForm.title.trim(),
            description: contentForm.description.trim() || undefined,
            body: contentForm.body.trim() || undefined,
            zoomUrl: contentForm.zoomUrl.trim() || undefined,
            zoomPassword: contentForm.zoomPassword.trim() || undefined,
            scheduledAt: contentForm.scheduledAt.trim() || undefined,
            recordingUrl: contentForm.recordingUrl.trim() || undefined,
          });
        } catch {
          // Gagal sync — data lokal tetap tersimpan
        }
      }

      showSuccess("Konten berhasil diperbarui.");
    } else {
      const newLocalId = uid("content");

      setClasses((prev) =>
        prev.map((c) => {
          if (c.id !== classId) return c;
          return {
            ...c,
            modules: c.modules.map((m) =>
              m.id === targetModuleId
                ? {
                    ...m,
                    contents: [
                      ...m.contents,
                      {
                        id: newLocalId,
                        type: contentForm.type,
                        title: contentForm.title.trim(),
                        description: contentForm.description.trim() || undefined,
                        body: contentForm.body.trim() || undefined,
                        zoomUrl: contentForm.zoomUrl.trim() || undefined,
                        zoomPassword: contentForm.zoomPassword.trim() || undefined,
                        scheduledAt: contentForm.scheduledAt.trim() || undefined,
                        recordingUrl: contentForm.recordingUrl.trim() || undefined,
                        attachments: [],
                      },
                    ],
                  }
                : m
            ),
            updatedAt: nowIso(),
          };
        })
      );

      try {
        const created = await adminAddCourseContent(classId, {
          type: contentForm.type,
          title: contentForm.title.trim(),
          description: contentForm.description.trim() || undefined,
          body: contentForm.body.trim() || undefined,
          zoomUrl: contentForm.zoomUrl.trim() || undefined,
          zoomPassword: contentForm.zoomPassword.trim() || undefined,
          scheduledAt: contentForm.scheduledAt.trim() || undefined,
          recordingUrl: contentForm.recordingUrl.trim() || undefined,
        });
        if (created?.id) {
          setClasses((prev) =>
            prev.map((c) => {
              if (c.id !== classId) return c;
              return {
                ...c,
                modules: c.modules.map((m) => ({
                  ...m,
                  contents: m.contents.map((x) =>
                    x.id === newLocalId ? { ...x, backendId: created.id } : x
                  ),
                })),
              };
            })
          );
        }
      } catch {
        // Gagal sync — data lokal tetap tersimpan
      }

      showSuccess("Konten berhasil ditambahkan.");
    }

    setContentSaving(false);
    setContentModalOpen(false);
    setEditingContentId(null);
    setError(null);
  };

  const removeContent = async (moduleId: string, contentId: string) => {
    if (!confirm("Hapus konten ini?")) return;

    const targetContent = selectedClass?.modules
      .flatMap((m) => m.contents)
      .find((x) => x.id === contentId);

    setClasses((prev) =>
      prev.map((c) => {
        if (c.id !== classId) return c;
        return {
          ...c,
          modules: c.modules.map((m) =>
            m.id === moduleId
              ? { ...m, contents: m.contents.filter((x) => x.id !== contentId) }
              : m
          ),
          updatedAt: nowIso(),
        };
      })
    );

    if (targetContent?.backendId) {
      try {
        await adminDeleteCourseContent(classId, targetContent.backendId);
      } catch {
        // Gagal sync — item sudah dihapus dari lokal
      }
    }

    showSuccess("Konten berhasil dihapus.");
  };

  // =================== Attachment handlers ===================

  const openAddAttachment = (contentId: string) => {
    setTargetContentIdForAttachment(contentId);
    setAttachmentForm(emptyAttachmentForm);
    setAttachmentModalOpen(true);
    setError(null);
  };

  const handleSaveAttachment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId || !targetContentIdForAttachment || !attachmentForm.name.trim() || !attachmentForm.url.trim()) {
      setError("Nama lampiran dan URL wajib diisi.");
      return;
    }
    const newAttachment: ClassAttachment = {
      id: uid("att"),
      type: attachmentForm.type,
      name: attachmentForm.name.trim(),
      url: attachmentForm.url.trim(),
    };
    setClasses((prev) =>
      prev.map((c) => {
        if (c.id !== classId) return c;
        return {
          ...c,
          modules: c.modules.map((m) => ({
            ...m,
            contents: m.contents.map((x) =>
              x.id === targetContentIdForAttachment
                ? { ...x, attachments: [...(x.attachments ?? []), newAttachment] }
                : x
            ),
          })),
          updatedAt: nowIso(),
        };
      })
    );
    setAttachmentModalOpen(false);
    setError(null);
    showSuccess("Lampiran berhasil ditambahkan.");
  };

  const removeAttachment = (contentId: string, attachmentId: string) => {
    setClasses((prev) =>
      prev.map((c) => {
        if (c.id !== classId) return c;
        return {
          ...c,
          modules: c.modules.map((m) => ({
            ...m,
            contents: m.contents.map((x) =>
              x.id === contentId
                ? { ...x, attachments: (x.attachments ?? []).filter((a) => a.id !== attachmentId) }
                : x
            ),
          })),
          updatedAt: nowIso(),
        };
      })
    );
    showSuccess("Lampiran berhasil dihapus.");
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

  if (!hydrated) {
    return (
      <div className="px-4 py-12 text-center text-sm text-zinc-500">
        Memuat data kelas…
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

      {!selectedClass ? (
        <div className="mt-8 rounded-xl border border-zinc-200 bg-zinc-50 px-6 py-10 text-center text-sm text-zinc-600">
          <p>Kelas tidak ditemukan (mungkin sudah dihapus atau ID salah).</p>
          <Link href="/admin/kelas" className="mt-2 inline-block font-medium text-emerald-700 underline">
            Ke daftar kelas
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Management Kelas</p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
              Modul: {selectedClass.title}
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              {selectedClass.description ?? "Tanpa deskripsi"} · {statusLabel(selectedClass.status)}
            </p>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-sm font-medium text-zinc-800">Struktur module, konten &amp; materi</p>
            <button
              type="button"
              onClick={openAddModule}
              className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
            >
              + Tambah Module
            </button>
          </div>

          <div className="mt-4 space-y-4">
            {selectedClass.modules.length === 0 ? (
              <p className="text-sm text-zinc-600">Belum ada module dalam kelas ini.</p>
            ) : (
              selectedClass.modules
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((m) => (
                  <div key={m.id} className="rounded-xl border border-zinc-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-zinc-100 px-3 py-2">
                      <div>
                        <p className="font-medium text-zinc-900">
                          Module {m.order}: {m.title}
                        </p>
                        {m.description ? <p className="text-xs text-zinc-500">{m.description}</p> : null}
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openAddContent(m.id)}
                          className="rounded border border-zinc-200 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-50"
                        >
                          + Konten
                        </button>
                        <button
                          type="button"
                          onClick={() => removeModule(m.id)}
                          className="rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2 p-3">
                      {m.contents.length === 0 ? (
                        <p className="text-xs text-zinc-500">Belum ada konten.</p>
                      ) : (
                        m.contents.map((x) => (
                          <div key={x.id} className="rounded-lg border border-zinc-100 bg-zinc-50/50 p-3">
                            {/* Content header */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${contentTypeBadgeClass(x.type)}`}
                                  >
                                    {contentTypeLabel(x.type)}
                                  </span>
                                  <span className="text-sm font-medium text-zinc-900">{x.title}</span>
                                </div>
                                {x.description && (
                                  <p className="mt-0.5 text-xs text-zinc-500">{x.description}</p>
                                )}

                                {/* Type-specific display */}
                                {(x.type === "module" || x.type === "lesson") && x.body && (
                                  <p className="mt-1 line-clamp-2 text-xs text-zinc-600">{x.body}</p>
                                )}
                                {x.type === "article" && x.body && (
                                  <p className="mt-1 line-clamp-2 text-xs text-zinc-600">{x.body}</p>
                                )}
                                {x.type === "zoom" && (
                                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                                    {x.zoomUrl && (
                                      <a
                                        href={x.zoomUrl}
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
                                {x.type === "recording" && (
                                  <div className="mt-1 text-xs">
                                    {x.recordingUrl && (
                                      <a
                                        href={x.recordingUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-red-700 underline underline-offset-1 hover:text-red-900"
                                      >
                                        Tonton Rekaman
                                      </a>
                                    )}
                                  </div>
                                )}

                                {/* Attachments (for module/lesson) */}
                                {(x.type === "module" || x.type === "lesson") &&
                                  (x.attachments ?? []).length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                      {(x.attachments ?? []).map((a) => (
                                        <div
                                          key={a.id}
                                          className="flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-xs text-zinc-700"
                                        >
                                          <span className="font-medium text-zinc-500">
                                            {attachmentTypeLabel(a.type)}
                                          </span>
                                          <a
                                            href={a.url}
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
                                {(x.type === "module" || x.type === "lesson") && (
                                  <button
                                    type="button"
                                    onClick={() => openAddAttachment(x.id)}
                                    className="rounded border border-zinc-200 px-2 py-1 text-xs text-zinc-700 hover:bg-white"
                                  >
                                    + Lampiran
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => openEditContent(m.id, x.id)}
                                  className="rounded border border-zinc-200 px-2 py-1 text-xs text-zinc-700 hover:bg-white"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeContent(m.id, x.id)}
                                  className="rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                                >
                                  Hapus
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))
            )}
          </div>
        </>
      )}

      {/* ===================== Module Modal ===================== */}
      {moduleModalOpen && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-zinc-900">Tambah Module</h3>
            <form onSubmit={handleSaveModule} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-600">Judul module *</label>
                <input
                  required
                  value={moduleForm.title}
                  onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">Deskripsi</label>
                <textarea
                  rows={2}
                  value={moduleForm.description}
                  onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModuleModalOpen(false)}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-sm"
                >
                  Batal
                </button>
                <button type="submit" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white">
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== Content Modal ===================== */}
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

              {/* Body (module / article) */}
              {(contentForm.type === "module" || contentForm.type === "article") && (
                <div>
                  <label className="block text-xs font-medium text-zinc-600">Isi / Materi</label>
                  <textarea
                    rows={5}
                    value={contentForm.body}
                    onChange={(e) => setContentForm((f) => ({ ...f, body: e.target.value }))}
                    placeholder="Tulis isi materi di sini…"
                    className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                  />
                </div>
              )}

              {/* Zoom fields */}
              {contentForm.type === "zoom" && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-zinc-600">URL Meeting Zoom *</label>
                    <input
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
                      onChange={(e) => setContentForm((f) => ({ ...f, zoomPassword: e.target.value }))}
                      placeholder="Opsional"
                      className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-600">Jadwal sesi</label>
                    <input
                      type="datetime-local"
                      value={contentForm.scheduledAt}
                      onChange={(e) => setContentForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                    />
                  </div>
                </>
              )}

              {/* Recording field */}
              {contentForm.type === "recording" && (
                <div>
                  <label className="block text-xs font-medium text-zinc-600">URL Rekaman *</label>
                  <input
                    value={contentForm.recordingUrl}
                    onChange={(e) => setContentForm((f) => ({ ...f, recordingUrl: e.target.value }))}
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

      {/* ===================== Attachment Modal ===================== */}
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
                <button type="submit" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white">
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
