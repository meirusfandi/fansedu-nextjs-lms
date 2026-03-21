"use client";

import {
  adminCreateCourseUnderSubject,
  adminCreateSubject,
  adminDeleteCourse,
  adminDeleteSubject,
  adminGetLevelSubjects,
  adminListCoursesBySubject,
  adminListLevels,
  adminUpdateCourse,
  adminUpdateSubject,
} from "@/lib/api";
import type { Course, Level, Subject } from "@/lib/api-types";
import { useCallback, useEffect, useMemo, useState } from "react";

const SD_SMP_SMA_SLUGS = ["sd", "smp", "sma"];

function filterLevelsSDSMPSMA(levels: Level[]): Level[] {
  const bySlug = new Map<string, Level>();
  levels.forEach((l) => {
    const slug = (l.slug ?? "").toLowerCase().trim();
    if (SD_SMP_SMA_SLUGS.includes(slug)) bySlug.set(slug, l);
  });
  return SD_SMP_SMA_SLUGS.map((s) => bySlug.get(s)).filter(Boolean) as Level[];
}

export default function MasterDataSubjectPage() {
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedLevelId, setExpandedLevelId] = useState<string | null>(null);
  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(null);
  const [subjectsByLevel, setSubjectsByLevel] = useState<Record<string, Subject[]>>({});
  const [modulesBySubject, setModulesBySubject] = useState<Record<string, Course[]>>({});

  const [bidangModalLevelId, setBidangModalLevelId] = useState<string | null>(null);
  const [bidangModalMode, setBidangModalMode] = useState<"add" | "edit" | null>(null);
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [bidangForm, setBidangForm] = useState({ name: "", slug: "", description: "" });

  const [moduleModalSubjectId, setModuleModalSubjectId] = useState<string | null>(null);
  const [moduleForm, setModuleForm] = useState({ title: "", description: "" });
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);

  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const levelsSDSMPSMA = useMemo(() => filterLevelsSDSMPSMA(levels), [levels]);

  const loadLevels = useCallback(() => {
    setLoading(true);
    setError(null);
    adminListLevels()
      .then(setLevels)
      .catch((e) => {
        setError((e as Error).message ?? "Gagal memuat daftar level");
        setLevels([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadLevels();
  }, [loadLevels]);

  const loadSubjects = useCallback((levelId: string) => {
    adminGetLevelSubjects(levelId)
      .then((list) =>
        setSubjectsByLevel((prev) => ({ ...prev, [levelId]: list }))
      )
      .catch(() =>
        setSubjectsByLevel((prev) => ({ ...prev, [levelId]: [] }))
      );
  }, []);

  const loadModules = useCallback((subjectId: string) => {
    adminListCoursesBySubject(subjectId)
      .then((list) =>
        setModulesBySubject((prev) => ({ ...prev, [subjectId]: list }))
      )
      .catch(() =>
        setModulesBySubject((prev) => ({ ...prev, [subjectId]: [] }))
      );
  }, []);

  const toggleLevel = (levelId: string) => {
    setExpandedLevelId((prev) => (prev === levelId ? null : levelId));
    if (!subjectsByLevel[levelId]) loadSubjects(levelId);
  };

  const toggleSubject = (subjectId: string) => {
    setExpandedSubjectId((prev) => (prev === subjectId ? null : subjectId));
    if (!modulesBySubject[subjectId]) loadModules(subjectId);
  };

  const openBidangAdd = (levelId: string) => {
    setBidangModalLevelId(levelId);
    setBidangForm({ name: "", slug: "", description: "" });
    setEditingSubjectId(null);
    setBidangModalMode("add");
    setSubmitError(null);
  };

  const openBidangEdit = (s: Subject, levelId: string) => {
    setBidangModalLevelId(levelId);
    setBidangForm({
      name: s.name,
      slug: s.slug ?? "",
      description: s.description ?? "",
    });
    setEditingSubjectId(s.id);
    setBidangModalMode("edit");
    setSubmitError(null);
  };

  const handleBidangSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const levelId = bidangModalLevelId;
    if (!levelId) return;
    setSubmitError(null);
    setSubmitLoading(true);
    try {
      if (bidangModalMode === "add") {
        await adminCreateSubject({
          name: bidangForm.name.trim(),
          slug: bidangForm.slug.trim() || undefined,
          description: bidangForm.description.trim() || undefined,
          level_id: levelId,
        });
      } else if (editingSubjectId) {
        await adminUpdateSubject(editingSubjectId, {
          name: bidangForm.name.trim(),
          slug: bidangForm.slug.trim() || undefined,
          description: bidangForm.description.trim() || undefined,
        });
      }
      setBidangModalLevelId(null);
      setBidangModalMode(null);
      setEditingSubjectId(null);
      loadSubjects(levelId);
    } catch (err) {
      setSubmitError((err as Error).message ?? "Gagal menyimpan");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteBidang = async (subjectId: string, levelId: string) => {
    if (!confirm("Hapus bidang ini? Semua module di dalamnya juga terpengaruh.")) return;
    try {
      await adminDeleteSubject(subjectId);
      loadSubjects(levelId);
      setModulesBySubject((prev) => {
        const next = { ...prev };
        delete next[subjectId];
        return next;
      });
    } catch (err) {
      setError((err as Error).message ?? "Gagal menghapus");
    }
  };

  const openModuleAdd = (subjectId: string) => {
    setModuleModalSubjectId(subjectId);
    setModuleForm({ title: "", description: "" });
    setEditingModuleId(null);
    setSubmitError(null);
  };

  const openModuleEdit = (c: Course, subjectId: string) => {
    setModuleModalSubjectId(subjectId);
    setModuleForm({ title: c.title, description: c.description ?? "" });
    setEditingModuleId(c.id);
    setSubmitError(null);
  };

  const handleModuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const subjectId = moduleModalSubjectId;
    if (!subjectId) return;
    setSubmitError(null);
    setSubmitLoading(true);
    try {
      if (editingModuleId) {
        await adminUpdateCourse(editingModuleId, {
          title: moduleForm.title.trim(),
          description: moduleForm.description.trim() || undefined,
        });
      } else {
        await adminCreateCourseUnderSubject(subjectId, {
          title: moduleForm.title.trim(),
          description: moduleForm.description.trim() || undefined,
        });
      }
      setModuleModalSubjectId(null);
      setEditingModuleId(null);
      loadModules(subjectId);
    } catch (err) {
      setSubmitError((err as Error).message ?? "Gagal menyimpan");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteModule = async (moduleId: string, subjectId: string) => {
    if (!confirm("Hapus module ini?")) return;
    try {
      await adminDeleteCourse(moduleId);
      loadModules(subjectId);
    } catch (err) {
      setError((err as Error).message ?? "Gagal menghapus");
    }
  };

  return (
    <div className="px-4 py-5 sm:px-6 md:px-8 md:py-8">
        <div className="mb-6 md:mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Master Data
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
            Subject — Kelas yang dibuka
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Daftar kelas/bidang yang saat ini dibuka untuk peserta. Hanya menampilkan yang dibuka per level SD, SMP, SMA.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {loading ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500">
              Memuat level (SD, SMP, SMA)...
            </div>
          ) : levelsSDSMPSMA.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500">
              Belum ada level SD, SMP, atau SMA yang dibuka. Tambah jenjang di Master Data → Jenjang Pendidikan (slug: sd, smp, sma), lalu muat ulang.
            </div>
          ) : (
            levelsSDSMPSMA.map((level) => (
              <div
                key={level.id}
                className="rounded-2xl border border-zinc-200 bg-white shadow-sm"
              >
                <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleLevel(level.id)}
                    className="flex flex-1 items-center gap-2 text-left"
                  >
                    <span className="text-lg font-medium text-zinc-900">
                      {level.name}
                    </span>
                    {level.description && (
                      <span className="text-xs text-zinc-500">
                        — {level.description}
                      </span>
                    )}
                    <span className="text-zinc-400">
                      {expandedLevelId === level.id ? "▼" : "▶"}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openBidangAdd(level.id)}
                    className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-50 hover:bg-zinc-800"
                  >
                    + Tambah Bidang
                  </button>
                </div>

                {expandedLevelId === level.id && (
                  <div className="border-t border-zinc-100 p-4">
                    {!subjectsByLevel[level.id] ? (
                      <p className="text-sm text-zinc-500">Memuat bidang...</p>
                    ) : subjectsByLevel[level.id].length === 0 ? (
                      <p className="text-sm text-zinc-500">
                        Belum ada subject di level ini. Klik &quot;+ Tambah Bidang&quot;.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {subjectsByLevel[level.id].map((subject) => (
                          <div
                            key={subject.id}
                            className="rounded-xl border border-zinc-100"
                          >
                            <div className="flex items-center justify-between px-3 py-2">
                              <button
                                type="button"
                                onClick={() => toggleSubject(subject.id)}
                                className="flex flex-1 items-center gap-2 text-left text-sm"
                              >
                                <span className="font-medium text-zinc-900">
                                  {subject.name}
                                </span>
                                {subject.description && (
                                  <span className="text-xs text-zinc-500">
                                    — {subject.description}
                                  </span>
                                )}
                                <span className="text-zinc-400">
                                  {expandedSubjectId === subject.id ? "▼" : "▶"}
                                </span>
                              </button>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => openBidangEdit(subject, level.id)}
                                  className="rounded border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openModuleAdd(subject.id)}
                                  className="rounded bg-zinc-900 px-2 py-1 text-xs font-medium text-zinc-50 hover:bg-zinc-800"
                                >
                                  + Module
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteBidang(subject.id, level.id)}
                                  className="rounded border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                                >
                                  Hapus
                                </button>
                              </div>
                            </div>
                            {expandedSubjectId === subject.id && (
                              <div className="border-t border-zinc-100 bg-zinc-50/50 p-3">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                                  Module
                                </p>
                                {!modulesBySubject[subject.id] ? (
                                  <p className="text-sm text-zinc-500">Memuat...</p>
                                ) : modulesBySubject[subject.id].length === 0 ? (
                                  <p className="text-sm text-zinc-500">
                                    Belum ada module. Klik &quot;+ Module&quot;.
                                  </p>
                                ) : (
                                  <ul className="space-y-2">
                                    {modulesBySubject[subject.id].map((c) => (
                                      <li
                                        key={c.id}
                                        className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
                                      >
                                        <div>
                                          <p className="font-medium text-zinc-900">
                                            {c.title}
                                          </p>
                                          {c.description && (
                                            <p className="text-xs text-zinc-500">
                                              {c.description}
                                            </p>
                                          )}
                                        </div>
                                        <div className="flex gap-2">
                                          <button
                                            type="button"
                                            onClick={() => openModuleEdit(c, subject.id)}
                                            className="text-xs text-zinc-600 underline hover:text-zinc-900"
                                          >
                                            Edit
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteModule(c.id, subject.id)}
                                            className="text-xs text-red-600 underline"
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
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

      {/* Modal Bidang */}
      {bidangModalMode && bidangModalLevelId && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-zinc-900">
              {bidangModalMode === "add" ? "Tambah Bidang" : "Edit Bidang"}
            </h2>
            {submitError && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {submitError}
              </div>
            )}
            <form onSubmit={handleBidangSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-600">
                  Nama bidang *
                </label>
                <input
                  type="text"
                  required
                  value={bidangForm.name}
                  onChange={(e) =>
                    setBidangForm({ ...bidangForm, name: e.target.value })
                  }
                  placeholder="Mis. Algoritma Dasar"
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">
                  Slug (opsional)
                </label>
                <input
                  type="text"
                  value={bidangForm.slug}
                  onChange={(e) =>
                    setBidangForm({ ...bidangForm, slug: e.target.value })
                  }
                  placeholder="algoritma-dasar"
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">
                  Deskripsi (opsional)
                </label>
                <textarea
                  rows={2}
                  value={bidangForm.description}
                  onChange={(e) =>
                    setBidangForm({ ...bidangForm, description: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setBidangModalLevelId(null);
                    setBidangModalMode(null);
                    setEditingSubjectId(null);
                  }}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 hover:bg-zinc-800 disabled:opacity-50"
                >
                  {submitLoading ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Module */}
      {moduleModalSubjectId && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-zinc-900">
              {editingModuleId ? "Edit Module" : "Tambah Module"}
            </h2>
            {submitError && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {submitError}
              </div>
            )}
            <form onSubmit={handleModuleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-600">
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
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">
                  Deskripsi (opsional)
                </label>
                <textarea
                  rows={2}
                  value={moduleForm.description}
                  onChange={(e) =>
                    setModuleForm({ ...moduleForm, description: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setModuleModalSubjectId(null);
                    setEditingModuleId(null);
                  }}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 hover:bg-zinc-800 disabled:opacity-50"
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
