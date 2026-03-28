"use client";

import { Pagination, PAGE_SIZE } from "@/components/Pagination";
import { OSN_PREP_CURRICULUM_MODULES } from "@/data/osn-class-curriculum";
import { adminListUsers, getFriendlyApiErrorMessage } from "@/lib/api";
import { useEffect, useMemo, useRef, useState } from "react";

type ClassStatus = "draft" | "published" | "archived";
type ContentType = "lesson" | "quiz" | "tryout";
type AssetType = "video" | "pdf" | "file" | "link";

type ClassAsset = {
  id: string;
  type: AssetType;
  title: string;
  url: string;
};

type ClassContent = {
  id: string;
  type: ContentType;
  title: string;
  description?: string;
  assets: ClassAsset[];
};

type ClassModule = {
  id: string;
  title: string;
  description?: string;
  order: number;
  contents: ClassContent[];
};

type AdminClass = {
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

const STORAGE_KEY = "fansedu_admin_classes_v2";

function uid(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function statusLabel(status: ClassStatus): string {
  if (status === "published") return "Published";
  if (status === "archived") return "Archived";
  return "Draft";
}

function contentTypeLabel(type: ContentType): string {
  if (type === "quiz") return "Quiz";
  if (type === "tryout") return "Tryout";
  return "Module";
}

function assetTypeLabel(type: AssetType): string {
  if (type === "pdf") return "PDF";
  if (type === "file") return "File";
  if (type === "video") return "Video";
  return "Link";
}

const emptyClassForm = {
  title: "",
  description: "",
  trainerId: "",
  startDate: "",
  endDate: "",
  status: "draft" as ClassStatus,
};

const emptyModuleForm = { title: "", description: "" };
const emptyContentForm = { type: "lesson" as ContentType, title: "", description: "" };
const emptyAssetForm = { type: "video" as AssetType, title: "", url: "" };

export default function AdminKelasPage() {
  const [classes, setClasses] = useState<AdminClass[]>([]);
  const [trainers, setTrainers] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [page, setPage] = useState(1);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [classModalMode, setClassModalMode] = useState<"add" | "edit" | null>(null);
  const [classForm, setClassForm] = useState(emptyClassForm);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);

  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [moduleForm, setModuleForm] = useState(emptyModuleForm);
  const [targetClassId, setTargetClassId] = useState<string | null>(null);

  const [contentModalOpen, setContentModalOpen] = useState(false);
  const [contentForm, setContentForm] = useState(emptyContentForm);
  const [targetModuleId, setTargetModuleId] = useState<string | null>(null);

  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [assetForm, setAssetForm] = useState(emptyAssetForm);
  const [targetContentId, setTargetContentId] = useState<string | null>(null);

  /**
   * Lewati satu kali eksekusi efek persist setelah mount: pada flush itu `classes` masih [] padahal
   * efek baca localStorage belum meng-update state (urutan efek + batching).
   * Hanya pakai ref + deps [classes] agar panjang dependency array stabil (hindari error React / HMR).
   */
  const skipNextLocalStorageWrite = useRef(true);

  useEffect(() => {
    adminListUsers()
      .then((users) => {
        const list = (users ?? [])
          .filter((u) => (u as { role?: string }).role === "trainer" || (u as { role?: string }).role === "guru")
          .map((u) => ({ id: u.id, name: u.name, email: u.email }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setTrainers(list);
      })
      .catch((e) => {
        // non-blocking: kelas masih bisa dibuat tanpa trainer
        setError(getFriendlyApiErrorMessage(e));
        setTrainers([]);
      });
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AdminClass[];
        const list = Array.isArray(parsed) ? parsed : [];
        setClasses(list);
        if (list.length > 0) {
          setSelectedClassId(list[0].id);
        }
      }
    } catch {
      setClasses([]);
    }
  }, []);

  useEffect(() => {
    if (skipNextLocalStorageWrite.current) {
      skipNextLocalStorageWrite.current = false;
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(classes));
    } catch {
      // quota / private mode — jangan ganggu UI
    }
  }, [classes]);

  const paginated = useMemo(
    () => classes.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [classes, page]
  );

  const selectedClass = useMemo(
    () => classes.find((c) => c.id === selectedClassId) ?? null,
    [classes, selectedClassId]
  );

  useEffect(() => {
    if (classes.length > 0 && (page - 1) * PAGE_SIZE >= classes.length) {
      setPage(1);
    }
  }, [classes.length, page]);

  const openAddClass = () => {
    setClassForm(emptyClassForm);
    setClassModalMode("add");
    setEditingClassId(null);
    setError(null);
  };

  const openEditClass = (c: AdminClass) => {
    setClassForm({
      title: c.title,
      description: c.description ?? "",
      trainerId: c.trainerId ?? "",
      startDate: c.startDate ?? "",
      endDate: c.endDate ?? "",
      status: c.status,
    });
    setEditingClassId(c.id);
    setClassModalMode("edit");
    setError(null);
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!classForm.title.trim()) {
      setError("Judul kelas wajib diisi.");
      return;
    }
    if (classModalMode === "add") {
      const trainer = trainers.find((t) => t.id === classForm.trainerId) ?? null;
      const created: AdminClass = {
        id: uid("class"),
        title: classForm.title.trim(),
        description: classForm.description.trim() || undefined,
        trainerId: classForm.trainerId || undefined,
        trainerName: trainer?.name ?? undefined,
        startDate: classForm.startDate || undefined,
        endDate: classForm.endDate || undefined,
        status: classForm.status,
        modules: [],
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      setClasses((prev) => [created, ...prev]);
      setSelectedClassId(created.id);
    } else if (classModalMode === "edit" && editingClassId) {
      setClasses((prev) =>
        prev.map((c) =>
          c.id === editingClassId
            ? {
                ...c,
                title: classForm.title.trim(),
                description: classForm.description.trim() || undefined,
                trainerId: classForm.trainerId || undefined,
                trainerName: (trainers.find((t) => t.id === classForm.trainerId)?.name ?? c.trainerName) || undefined,
                startDate: classForm.startDate || undefined,
                endDate: classForm.endDate || undefined,
                status: classForm.status,
                updatedAt: nowIso(),
              }
            : c
        )
      );
    }
    setClassModalMode(null);
  };

  const handleDeleteClass = (id: string) => {
    if (!confirm("Hapus kelas ini beserta semua module/quiz/tryout dan materi?")) return;
    setClasses((prev) => prev.filter((c) => c.id !== id));
    setSelectedClassId((prev) => (prev === id ? null : prev));
  };

  const handleImportOsnPrepClass = () => {
    if (
      !confirm(
        "Buat kelas baru berisi 8 modul materi persiapan OSN-K (Computational Thinking → Strategi ujian)? Kelas lama tidak diubah."
      )
    ) {
      return;
    }
    setError(null);
    const modules: ClassModule[] = OSN_PREP_CURRICULUM_MODULES.map((spec, i) => ({
      id: uid("mod"),
      title: spec.title,
      description: spec.focus,
      order: i + 1,
      contents: [
        {
          id: uid("content"),
          type: "lesson" as const,
          title: "Rencana slide & materi",
          description: spec.lessonBody,
          assets: [],
        },
      ],
    }));
    const created: AdminClass = {
      id: uid("class"),
      title: "Persiapan OSN-K (Kurikulum contoh)",
      description:
        "Delapan sesi: CT, Himpunan & Boolean, Kombinatorika, Deret & model matematis, Graf & geometri, C++ dasar, Array & rekursi, review tryout & strategi.",
      status: "draft",
      modules,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    setClasses((prev) => [created, ...prev]);
    setSelectedClassId(created.id);
  };

  const openAddModule = (classId: string) => {
    setTargetClassId(classId);
    setModuleForm(emptyModuleForm);
    setModuleModalOpen(true);
    setError(null);
  };

  const handleSaveModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetClassId || !moduleForm.title.trim()) {
      setError("Judul module wajib diisi.");
      return;
    }
    setClasses((prev) =>
      prev.map((c) => {
        if (c.id !== targetClassId) return c;
        const nextOrder = c.modules.length + 1;
        const module: ClassModule = {
          id: uid("mod"),
          title: moduleForm.title.trim(),
          description: moduleForm.description.trim() || undefined,
          order: nextOrder,
          contents: [],
        };
        return { ...c, modules: [...c.modules, module], updatedAt: nowIso() };
      })
    );
    setModuleModalOpen(false);
  };

  const removeModule = (classId: string, moduleId: string) => {
    if (!confirm("Hapus module ini?")) return;
    setClasses((prev) =>
      prev.map((c) =>
        c.id === classId
          ? { ...c, modules: c.modules.filter((m) => m.id !== moduleId), updatedAt: nowIso() }
          : c
      )
    );
  };

  const openAddContent = (moduleId: string) => {
    setTargetModuleId(moduleId);
    setContentForm(emptyContentForm);
    setContentModalOpen(true);
    setError(null);
  };

  const handleSaveContent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !targetModuleId || !contentForm.title.trim()) {
      setError("Judul konten wajib diisi.");
      return;
    }
    setClasses((prev) =>
      prev.map((c) => {
        if (c.id !== selectedClassId) return c;
        return {
          ...c,
          modules: c.modules.map((m) =>
            m.id === targetModuleId
              ? {
                  ...m,
                  contents: [
                    ...m.contents,
                    {
                      id: uid("content"),
                      type: contentForm.type,
                      title: contentForm.title.trim(),
                      description: contentForm.description.trim() || undefined,
                      assets: [],
                    },
                  ],
                }
              : m
          ),
          updatedAt: nowIso(),
        };
      })
    );
    setContentModalOpen(false);
  };

  const removeContent = (moduleId: string, contentId: string) => {
    if (!selectedClassId) return;
    if (!confirm("Hapus konten ini?")) return;
    setClasses((prev) =>
      prev.map((c) => {
        if (c.id !== selectedClassId) return c;
        return {
          ...c,
          modules: c.modules.map((m) =>
            m.id === moduleId ? { ...m, contents: m.contents.filter((x) => x.id !== contentId) } : m
          ),
          updatedAt: nowIso(),
        };
      })
    );
  };

  const openAddAsset = (contentId: string) => {
    setTargetContentId(contentId);
    setAssetForm(emptyAssetForm);
    setAssetModalOpen(true);
    setError(null);
  };

  const handleSaveAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !targetContentId || !assetForm.title.trim() || !assetForm.url.trim()) {
      setError("Judul materi dan URL/path wajib diisi.");
      return;
    }
    setClasses((prev) =>
      prev.map((c) => {
        if (c.id !== selectedClassId) return c;
        return {
          ...c,
          modules: c.modules.map((m) => ({
            ...m,
            contents: m.contents.map((x) =>
              x.id === targetContentId
                ? {
                    ...x,
                    assets: [
                      ...x.assets,
                      {
                        id: uid("asset"),
                        type: assetForm.type,
                        title: assetForm.title.trim(),
                        url: assetForm.url.trim(),
                      },
                    ],
                  }
                : x
            ),
          })),
          updatedAt: nowIso(),
        };
      })
    );
    setAssetModalOpen(false);
  };

  const removeAsset = (contentId: string, assetId: string) => {
    if (!selectedClassId) return;
    setClasses((prev) =>
      prev.map((c) => {
        if (c.id !== selectedClassId) return c;
        return {
          ...c,
          modules: c.modules.map((m) => ({
            ...m,
            contents: m.contents.map((x) =>
              x.id === contentId ? { ...x, assets: x.assets.filter((a) => a.id !== assetId) } : x
            ),
          })),
          updatedAt: nowIso(),
        };
      })
    );
  };

  return (
    <div className="px-4 py-5 sm:px-6 md:px-8 md:py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 md:mb-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Manage</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
            Management Kelas
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Admin dapat membuat, melihat, mengedit, menghapus kelas, serta mengatur module, quiz/tryout, dan materi
            (video, file, pdf, link). Struktur ini siap dipakai bersama trainer/pengajar.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleImportOsnPrepClass}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
          >
            Impor materi OSN (8 modul)
          </button>
          <button
            type="button"
            onClick={openAddClass}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 hover:bg-zinc-800"
          >
            + Tambah Kelas
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1.8fr]">
        <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-900">Daftar Kelas</div>
          {classes.length === 0 ? (
            <div className="p-6 text-sm text-zinc-600">Belum ada kelas. Klik "Tambah Kelas".</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-zinc-200 text-sm">
                  <thead className="bg-zinc-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-zinc-600">Kelas</th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-600">Status</th>
                      <th className="px-4 py-3 text-right font-medium text-zinc-600">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {paginated.map((c) => (
                      <tr
                        key={c.id}
                        className={`cursor-pointer hover:bg-zinc-50 ${selectedClassId === c.id ? "bg-zinc-50/80" : ""}`}
                        onClick={() => setSelectedClassId(c.id)}
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-zinc-900">{c.title}</p>
                      <p className="text-xs text-zinc-500">{c.trainerName ?? "Trainer belum ditentukan"}</p>
                        </td>
                        <td className="px-4 py-3 text-zinc-700">{statusLabel(c.status)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditClass(c);
                            }}
                            className="mr-2 text-xs text-sky-700 hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClass(c.id);
                            }}
                            className="text-xs text-red-600 hover:underline"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination currentPage={page} totalItems={classes.length} onPageChange={setPage} label="kelas" />
            </>
          )}
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
          {!selectedClass ? (
            <div className="p-6 text-sm text-zinc-600">Pilih kelas untuk mengelola module/quiz/tryout dan materinya.</div>
          ) : (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3">
                <div>
                  <h2 className="text-base font-semibold text-zinc-900">{selectedClass.title}</h2>
                  <p className="text-xs text-zinc-500">
                    {selectedClass.description ?? "Tanpa deskripsi"} · {statusLabel(selectedClass.status)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openAddModule(selectedClass.id)}
                  className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
                >
                  + Tambah Module
                </button>
              </div>

              <div className="space-y-4 p-4">
                {selectedClass.modules.length === 0 ? (
                  <p className="text-sm text-zinc-600">Belum ada module dalam kelas ini.</p>
                ) : (
                  selectedClass.modules
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map((m) => (
                      <div key={m.id} className="rounded-xl border border-zinc-200">
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
                              onClick={() => removeModule(selectedClass.id, m.id)}
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
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-medium text-zinc-900">
                                      {contentTypeLabel(x.type)} - {x.title}
                                    </p>
                                    {x.description ? <p className="text-xs text-zinc-500">{x.description}</p> : null}
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => openAddAsset(x.id)}
                                      className="rounded border border-zinc-200 px-2 py-1 text-xs text-zinc-700 hover:bg-white"
                                    >
                                      + Materi
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => removeContent(m.id, x.id)}
                                      className="text-xs text-red-600 hover:underline"
                                    >
                                      Hapus
                                    </button>
                                  </div>
                                </div>
                                <ul className="mt-2 space-y-1">
                                  {x.assets.length === 0 ? (
                                    <li className="text-xs text-zinc-500">Belum ada materi.</li>
                                  ) : (
                                    x.assets.map((a) => (
                                      <li key={a.id} className="flex items-center justify-between text-xs text-zinc-700">
                                        <span>
                                          [{assetTypeLabel(a.type)}] {a.title} - {a.url}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => removeAsset(x.id, a.id)}
                                          className="text-red-600 hover:underline"
                                        >
                                          Hapus
                                        </button>
                                      </li>
                                    ))
                                  )}
                                </ul>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      {classModalMode && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-zinc-900">
              {classModalMode === "add" ? "Tambah Kelas" : "Edit Kelas"}
            </h3>
            <form onSubmit={handleSaveClass} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-600">Judul kelas *</label>
                <input
                  required
                  value={classForm.title}
                  onChange={(e) => setClassForm((f) => ({ ...f, title: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">Deskripsi</label>
                <textarea
                  rows={2}
                  value={classForm.description}
                  onChange={(e) => setClassForm((f) => ({ ...f, description: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-600">Trainer / Pengajar</label>
                  <select
                    value={classForm.trainerId}
                    onChange={(e) => setClassForm((f) => ({ ...f, trainerId: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                  >
                    <option value="">— Pilih trainer (opsional) —</option>
                    {trainers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.email})
                      </option>
                    ))}
                  </select>
                  {trainers.length === 0 ? (
                    <p className="mt-1 text-xs text-zinc-500">
                      Belum ada user role trainer/pengajar atau gagal memuat daftar. Kelas tetap bisa disimpan tanpa trainer.
                    </p>
                  ) : null}
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600">Status</label>
                  <select
                    value={classForm.status}
                    onChange={(e) => setClassForm((f) => ({ ...f, status: e.target.value as ClassStatus }))}
                    className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-600">Mulai</label>
                  <input
                    type="date"
                    value={classForm.startDate}
                    onChange={(e) => setClassForm((f) => ({ ...f, startDate: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600">Selesai</label>
                  <input
                    type="date"
                    value={classForm.endDate}
                    onChange={(e) => setClassForm((f) => ({ ...f, endDate: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setClassModalMode(null)}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                >
                  Batal
                </button>
                <button type="submit" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800">
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

      {contentModalOpen && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-zinc-900">Tambah Konten (Module / Quiz / Tryout)</h3>
            <form onSubmit={handleSaveContent} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-600">Tipe *</label>
                <select
                  value={contentForm.type}
                  onChange={(e) => setContentForm((f) => ({ ...f, type: e.target.value as ContentType }))}
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                >
                  <option value="lesson">Module</option>
                  <option value="quiz">Quiz</option>
                  <option value="tryout">Tryout</option>
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
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setContentModalOpen(false)}
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

      {assetModalOpen && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-zinc-900">Tambah Materi</h3>
            <form onSubmit={handleSaveAsset} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-600">Tipe *</label>
                <select
                  value={assetForm.type}
                  onChange={(e) => setAssetForm((f) => ({ ...f, type: e.target.value as AssetType }))}
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                >
                  <option value="video">Video</option>
                  <option value="pdf">PDF</option>
                  <option value="file">File</option>
                  <option value="link">Link</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">Judul materi *</label>
                <input
                  required
                  value={assetForm.title}
                  onChange={(e) => setAssetForm((f) => ({ ...f, title: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">URL / path file *</label>
                <input
                  required
                  value={assetForm.url}
                  onChange={(e) => setAssetForm((f) => ({ ...f, url: e.target.value }))}
                  placeholder="https://... atau /uploads/..."
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssetModalOpen(false)}
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

