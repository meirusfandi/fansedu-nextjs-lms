"use client";

import { AdminSidebar } from "@/components/AdminSidebar";
import {
  adminCreateCourseUnderSubject,
  adminCreateSubject,
  adminDeleteCourse,
  adminDeleteSubject,
  adminListCoursesBySubject,
  adminListSubjects,
  adminUpdateCourse,
  adminUpdateSubject,
  logout,
  clearAuthToken,
} from "@/lib/api";
import type { Course, Subject } from "@/lib/api-types";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function AdminKelasPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [kelasList, setKelasList] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kelasModal, setKelasModal] = useState<"add" | "edit" | null>(null);
  const [editingKelasId, setEditingKelasId] = useState<string | null>(null);
  const [kelasForm, setKelasForm] = useState({
    name: "",
    slug: "",
    description: "",
  });
  const [expandedKelasId, setExpandedKelasId] = useState<string | null>(null);
  const [modulesByKelas, setModulesByKelas] = useState<Record<string, Course[]>>({});
  const [moduleModalKelasId, setModuleModalKelasId] = useState<string | null>(null);
  const [moduleForm, setModuleForm] = useState({ title: "", description: "" });
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleLogout = useCallback(() => {
    logout().catch(() => {});
    clearAuthToken();
    router.push("/login");
  }, [router]);

  const loadKelas = useCallback(() => {
    setLoading(true);
    setError(null);
    adminListSubjects()
      .then(setKelasList)
      .catch((e) => {
        setError((e as Error).message ?? "Gagal memuat daftar kelas");
        setKelasList([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadKelas();
  }, [loadKelas]);

  const loadModules = useCallback((kelasId: string) => {
    adminListCoursesBySubject(kelasId)
      .then((list) =>
        setModulesByKelas((prev) => ({ ...prev, [kelasId]: list }))
      )
      .catch(() =>
        setModulesByKelas((prev) => ({ ...prev, [kelasId]: [] }))
      );
  }, []);

  const openKelasAdd = () => {
    setKelasForm({ name: "", slug: "", description: "" });
    setEditingKelasId(null);
    setKelasModal("add");
    setSubmitError(null);
  };

  const openKelasEdit = (k: Subject) => {
    setKelasForm({
      name: k.name,
      slug: k.slug ?? "",
      description: k.description ?? "",
    });
    setEditingKelasId(k.id);
    setKelasModal("edit");
    setSubmitError(null);
  };

  const handleKelasSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitLoading(true);
    try {
      if (kelasModal === "add") {
        await adminCreateSubject({
          name: kelasForm.name.trim(),
          slug: kelasForm.slug.trim() || undefined,
          description: kelasForm.description.trim() || undefined,
        });
      } else if (editingKelasId) {
        await adminUpdateSubject(editingKelasId, {
          name: kelasForm.name.trim(),
          slug: kelasForm.slug.trim() || undefined,
          description: kelasForm.description.trim() || undefined,
        });
      }
      setKelasModal(null);
      setEditingKelasId(null);
      loadKelas();
    } catch (err) {
      setSubmitError((err as Error).message ?? "Gagal menyimpan");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteKelas = async (id: string) => {
    if (!confirm("Hapus kelas ini? Semua module, quiz, dan test di dalamnya juga terpengaruh.")) return;
    try {
      await adminDeleteSubject(id);
      loadKelas();
      setModulesByKelas((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (err) {
      setError((err as Error).message ?? "Gagal menghapus");
    }
  };

  const openModuleAdd = (kelasId: string) => {
    setModuleModalKelasId(kelasId);
    setModuleForm({ title: "", description: "" });
    setEditingModuleId(null);
    setSubmitError(null);
  };

  const openModuleEdit = (c: Course, kelasId: string) => {
    setModuleModalKelasId(kelasId);
    setModuleForm({
      title: c.title,
      description: c.description ?? "",
    });
    setEditingModuleId(c.id);
    setSubmitError(null);
  };

  const handleModuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const kelasId = moduleModalKelasId;
    if (!kelasId) return;
    setSubmitError(null);
    setSubmitLoading(true);
    try {
      if (editingModuleId) {
        await adminUpdateCourse(editingModuleId, {
          title: moduleForm.title.trim(),
          description: moduleForm.description.trim() || undefined,
        });
      } else {
        await adminCreateCourseUnderSubject(kelasId, {
          title: moduleForm.title.trim(),
          description: moduleForm.description.trim() || undefined,
        });
      }
      setModuleModalKelasId(null);
      setEditingModuleId(null);
      loadModules(kelasId);
    } catch (err) {
      setSubmitError((err as Error).message ?? "Gagal menyimpan");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteModule = async (moduleId: string, kelasId: string) => {
    if (!confirm("Hapus module ini?")) return;
    try {
      await adminDeleteCourse(moduleId);
      loadModules(kelasId);
    } catch (err) {
      setError((err as Error).message ?? "Gagal menghapus");
    }
  };

  const toggleExpand = (kelasId: string) => {
    setExpandedKelasId((prev) => (prev === kelasId ? null : kelasId));
    if (!modulesByKelas[kelasId]) loadModules(kelasId);
  };

  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <AdminSidebar currentPath={pathname ?? ""} onLogout={handleLogout} />

      <main className="flex-1 px-4 py-5 sm:px-6 md:px-8 md:py-8">
        <div className="mb-6 flex items-center justify-between md:mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
              Manage
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
              Management Kelas
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Buat beberapa kelas, tambah module, quiz, dan test ke tiap kelas.
            </p>
          </div>
          <button
            type="button"
            onClick={openKelasAdd}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 shadow-sm hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            + Tambah Kelas
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {loading ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
              Memuat daftar kelas...
            </div>
          ) : kelasList.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
              Belum ada kelas. Klik &quot;Tambah Kelas&quot; untuk membuat (mis. Algoritma Dasar, Struktur Data).
            </div>
          ) : (
            kelasList.map((k) => (
              <div
                key={k.id}
                className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => toggleExpand(k.id)}
                    className="flex flex-1 items-center gap-2 text-left"
                  >
                    <span className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
                      {k.name}
                    </span>
                    {k.description && (
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        — {k.description}
                      </span>
                    )}
                    <span className="text-zinc-400">
                      {expandedKelasId === k.id ? "▼" : "▶"}
                    </span>
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openKelasEdit(k)}
                      className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => openModuleAdd(k.id)}
                      className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                    >
                      + Module
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteKelas(k.id)}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
                {expandedKelasId === k.id && (
                  <div className="border-t border-zinc-100 p-4 dark:border-zinc-800">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Module
                    </p>
                    {!modulesByKelas[k.id] ? (
                      <p className="text-sm text-zinc-500">Memuat...</p>
                    ) : modulesByKelas[k.id].length === 0 ? (
                      <p className="text-sm text-zinc-500">
                        Belum ada module. Klik &quot;+ Module&quot; untuk menambah.
                      </p>
                    ) : (
                      <ul className="mb-4 space-y-2">
                        {modulesByKelas[k.id].map((c) => (
                          <li
                            key={c.id}
                            className="flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-2 dark:border-zinc-800"
                          >
                            <div>
                              <p className="font-medium text-zinc-900 dark:text-zinc-50">
                                {c.title}
                              </p>
                              {c.description && (
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                  {c.description}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => openModuleEdit(c, k.id)}
                                className="text-xs text-zinc-600 underline hover:text-zinc-900 dark:hover:text-zinc-100"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteModule(c.id, k.id)}
                                className="text-xs text-red-600 underline"
                              >
                                Hapus
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 p-3 text-center text-xs text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/30 dark:text-zinc-400">
                      <strong>Quiz</strong> dan <strong>Test</strong> per module — segera hadir.
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>

      {/* Modal Kelas */}
      {kelasModal && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {kelasModal === "add" ? "Tambah Kelas" : "Edit Kelas"}
            </h2>
            {submitError && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                {submitError}
              </div>
            )}
            <form onSubmit={handleKelasSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Nama kelas *
                </label>
                <input
                  type="text"
                  required
                  value={kelasForm.name}
                  onChange={(e) =>
                    setKelasForm({ ...kelasForm, name: e.target.value })
                  }
                  placeholder="Mis. Algoritma Dasar"
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Slug (opsional)
                </label>
                <input
                  type="text"
                  value={kelasForm.slug}
                  onChange={(e) =>
                    setKelasForm({ ...kelasForm, slug: e.target.value })
                  }
                  placeholder="algoritma-dasar"
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Deskripsi (opsional)
                </label>
                <textarea
                  rows={2}
                  value={kelasForm.description}
                  onChange={(e) =>
                    setKelasForm({ ...kelasForm, description: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setKelasModal(null);
                    setEditingKelasId(null);
                  }}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  {submitLoading ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Module */}
      {moduleModalKelasId && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {editingModuleId ? "Edit Module" : "Tambah Module"}
            </h2>
            {submitError && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                {submitError}
              </div>
            )}
            <form onSubmit={handleModuleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Judul module *
                </label>
                <input
                  type="text"
                  required
                  value={moduleForm.title}
                  onChange={(e) =>
                    setModuleForm({ ...moduleForm, title: e.target.value })
                  }
                  placeholder="Mis. Minggu 1 - Pengenalan"
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Deskripsi (opsional)
                </label>
                <textarea
                  rows={2}
                  value={moduleForm.description}
                  onChange={(e) =>
                    setModuleForm({ ...moduleForm, description: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setModuleModalKelasId(null);
                    setEditingModuleId(null);
                  }}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  {submitLoading ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
