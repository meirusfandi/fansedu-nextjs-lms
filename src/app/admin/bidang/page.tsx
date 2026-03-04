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

export default function AdminBidangPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subjectModal, setSubjectModal] = useState<"add" | "edit" | null>(null);
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [subjectForm, setSubjectForm] = useState({
    name: "",
    slug: "",
    description: "",
  });
  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(null);
  const [coursesBySubject, setCoursesBySubject] = useState<Record<string, Course[]>>({});
  const [courseModalSubjectId, setCourseModalSubjectId] = useState<string | null>(null);
  const [courseForm, setCourseForm] = useState({ title: "", description: "" });
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleLogout = useCallback(() => {
    logout().catch(() => {});
    clearAuthToken();
    router.push("/login");
  }, [router]);

  const loadSubjects = useCallback(() => {
    setLoading(true);
    setError(null);
    adminListSubjects()
      .then(setSubjects)
      .catch((e) => {
        setError((e as Error).message ?? "Gagal memuat daftar course");
        setSubjects([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  const loadCourses = useCallback((subjectId: string) => {
    adminListCoursesBySubject(subjectId)
      .then((list) =>
        setCoursesBySubject((prev) => ({ ...prev, [subjectId]: list }))
      )
      .catch(() =>
        setCoursesBySubject((prev) => ({ ...prev, [subjectId]: [] }))
      );
  }, []);

  const openSubjectAdd = () => {
    setSubjectForm({ name: "", slug: "", description: "" });
    setEditingSubjectId(null);
    setSubjectModal("add");
    setSubmitError(null);
  };

  const openSubjectEdit = (s: Subject) => {
    setSubjectForm({
      name: s.name,
      slug: s.slug ?? "",
      description: s.description ?? "",
    });
    setEditingSubjectId(s.id);
    setSubjectModal("edit");
    setSubmitError(null);
  };

  const handleSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitLoading(true);
    try {
      if (subjectModal === "add") {
        await adminCreateSubject({
          name: subjectForm.name.trim(),
          slug: subjectForm.slug.trim() || undefined,
          description: subjectForm.description.trim() || undefined,
        });
      } else if (editingSubjectId) {
        await adminUpdateSubject(editingSubjectId, {
          name: subjectForm.name.trim(),
          slug: subjectForm.slug.trim() || undefined,
          description: subjectForm.description.trim() || undefined,
        });
      }
      setSubjectModal(null);
      setEditingSubjectId(null);
      loadSubjects();
    } catch (err) {
      setSubmitError((err as Error).message ?? "Gagal menyimpan");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (!confirm("Hapus course ini? Semua module (minggu) di dalamnya juga terpengaruh.")) return;
    try {
      await adminDeleteSubject(id);
      loadSubjects();
      setCoursesBySubject((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (err) {
      setError((err as Error).message ?? "Gagal menghapus");
    }
  };

  const openCourseAdd = (subjectId: string) => {
    setCourseModalSubjectId(subjectId);
    setCourseForm({ title: "", description: "" });
    setEditingCourseId(null);
    setSubmitError(null);
  };

  const openCourseEdit = (c: Course, subjectId: string) => {
    setCourseModalSubjectId(subjectId);
    setCourseForm({
      title: c.title,
      description: c.description ?? "",
    });
    setEditingCourseId(c.id);
    setSubmitError(null);
  };

  const handleCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const subjectId = courseModalSubjectId;
    if (!subjectId) return;
    setSubmitError(null);
    setSubmitLoading(true);
    try {
      if (editingCourseId) {
        await adminUpdateCourse(editingCourseId, {
          title: courseForm.title.trim(),
          description: courseForm.description.trim() || undefined,
        });
      } else {
        await adminCreateCourseUnderSubject(subjectId, {
          title: courseForm.title.trim(),
          description: courseForm.description.trim() || undefined,
        });
      }
      setCourseModalSubjectId(null);
      setEditingCourseId(null);
      loadCourses(subjectId);
    } catch (err) {
      setSubmitError((err as Error).message ?? "Gagal menyimpan");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId: string, subjectId: string) => {
    if (!confirm("Hapus module (minggu) ini?")) return;
    try {
      await adminDeleteCourse(courseId);
      loadCourses(subjectId);
    } catch (err) {
      setError((err as Error).message ?? "Gagal menghapus");
    }
  };

  const toggleExpand = (subjectId: string) => {
    setExpandedSubjectId((prev) =>
      prev === subjectId ? null : subjectId
    );
    if (!coursesBySubject[subjectId]) loadCourses(subjectId);
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
              Course / Module
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Kelola course dan module per minggu; tiap module nantinya berisi quiz.
            </p>
          </div>
          <button
            type="button"
            onClick={openSubjectAdd}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 shadow-sm hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            + Tambah Course
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
              Memuat daftar bidang...
            </div>
          ) : subjects.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
              Belum ada course. Klik &quot;Tambah Course&quot; untuk membuat (mis. Algoritma Dasar, Struktur Data).
            </div>
          ) : (
            subjects.map((s) => (
              <div
                key={s.id}
                className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => toggleExpand(s.id)}
                    className="flex flex-1 items-center gap-2 text-left"
                  >
                    <span className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
                      {s.name}
                    </span>
                    {s.description && (
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        — {s.description}
                      </span>
                    )}
                    <span className="text-zinc-400">
                      {expandedSubjectId === s.id ? "▼" : "▶"}
                    </span>
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openSubjectEdit(s)}
                      className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => openCourseAdd(s.id)}
                      className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                    >
                      + Module (Minggu)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSubject(s.id)}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
                {expandedSubjectId === s.id && (
                  <div className="border-t border-zinc-100 p-4 dark:border-zinc-800">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Module per minggu
                    </p>
                    <p className="mb-3 text-[11px] text-zinc-500 dark:text-zinc-400">
                      Tiap module nantinya berisi quiz untuk minggu tersebut.
                    </p>
                    {!coursesBySubject[s.id] ? (
                      <p className="text-sm text-zinc-500">Memuat...</p>
                    ) : coursesBySubject[s.id].length === 0 ? (
                      <p className="text-sm text-zinc-500">
                        Belum ada module. Klik &quot;+ Module (Minggu)&quot; untuk menambah (mis. Minggu 1, Minggu 2).
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {coursesBySubject[s.id].map((c) => (
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
                                onClick={() => openCourseEdit(c, s.id)}
                                className="text-xs text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCourse(c.id, s.id)}
                                className="text-xs text-red-600 underline hover:text-red-700"
                              >
                                Hapus
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>

      {/* Modal Course */}
      {subjectModal && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {subjectModal === "add" ? "Tambah Course" : "Edit Course"}
            </h2>
            {submitError && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                {submitError}
              </div>
            )}
            <form onSubmit={handleSubjectSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Nama course *
                </label>
                <input
                  type="text"
                  required
                  value={subjectForm.name}
                  onChange={(e) =>
                    setSubjectForm({ ...subjectForm, name: e.target.value })
                  }
                  placeholder="Mis. Algoritma Dasar, Struktur Data"
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Slug (opsional)
                </label>
                <input
                  type="text"
                  value={subjectForm.slug}
                  onChange={(e) =>
                    setSubjectForm({ ...subjectForm, slug: e.target.value })
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
                  value={subjectForm.description}
                  onChange={(e) =>
                    setSubjectForm({
                      ...subjectForm,
                      description: e.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setSubjectModal(null);
                    setEditingSubjectId(null);
                  }}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
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

      {/* Modal Module (Minggu) */}
      {courseModalSubjectId && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {editingCourseId ? "Edit Module (Minggu)" : "Tambah Module (Minggu)"}
            </h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Nantinya module ini dapat berisi quiz untuk minggu tersebut.
            </p>
            {submitError && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                {submitError}
              </div>
            )}
            <form onSubmit={handleCourseSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Judul module (minggu) *
                </label>
                <input
                  type="text"
                  required
                  value={courseForm.title}
                  onChange={(e) =>
                    setCourseForm({ ...courseForm, title: e.target.value })
                  }
                  placeholder="Mis. Minggu 1, Minggu 2, atau Materi Pengenalan"
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Deskripsi / ringkasan (opsional)
                </label>
                <textarea
                  rows={2}
                  value={courseForm.description}
                  onChange={(e) =>
                    setCourseForm({
                      ...courseForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Nantinya berisi quiz untuk minggu ini."
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setCourseModalSubjectId(null);
                    setEditingCourseId(null);
                  }}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
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
