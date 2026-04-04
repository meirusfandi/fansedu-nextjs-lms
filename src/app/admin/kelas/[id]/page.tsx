"use client";

import {
  assetTypeLabel,
  contentTypeLabel,
  emptyAssetForm,
  emptyContentForm,
  emptyModuleForm,
  type AdminClass,
  type AssetType,
  type ContentType,
  nowIso,
  statusLabel,
  uid,
} from "@/features/admin/local-kelas-storage";
import { useAdminLocalClasses } from "@/features/admin/useAdminLocalClasses";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

export default function AdminKelasModulesPage() {
  const params = useParams<{ id: string }>();
  const classId = String(params?.id ?? "").trim();

  const { classes, setClasses, hydrated } = useAdminLocalClasses();
  const [error, setError] = useState<string | null>(null);

  const selectedClass = useMemo(() => classes.find((c) => c.id === classId) ?? null, [classes, classId]);

  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [moduleForm, setModuleForm] = useState(emptyModuleForm);

  const [contentModalOpen, setContentModalOpen] = useState(false);
  const [contentForm, setContentForm] = useState(emptyContentForm);
  const [targetModuleId, setTargetModuleId] = useState<string | null>(null);

  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [assetForm, setAssetForm] = useState(emptyAssetForm);
  const [targetContentId, setTargetContentId] = useState<string | null>(null);

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
  };

  const removeModule = (moduleId: string) => {
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
    if (!classId || !targetModuleId || !contentForm.title.trim()) {
      setError("Judul konten wajib diisi.");
      return;
    }
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
    setError(null);
  };

  const removeContent = (moduleId: string, contentId: string) => {
    if (!confirm("Hapus konten ini?")) return;
    setClasses((prev) =>
      prev.map((c) => {
        if (c.id !== classId) return c;
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
    if (!classId || !targetContentId || !assetForm.title.trim() || !assetForm.url.trim()) {
      setError("Judul materi dan URL/path wajib diisi.");
      return;
    }
    setClasses((prev) =>
      prev.map((c) => {
        if (c.id !== classId) return c;
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
    setError(null);
  };

  const removeAsset = (contentId: string, assetId: string) => {
    setClasses((prev) =>
      prev.map((c) => {
        if (c.id !== classId) return c;
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
        </>
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
