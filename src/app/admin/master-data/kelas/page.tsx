"use client";

import Link from "next/link";
import { Pagination, PAGE_SIZE } from "@/components/Pagination";
import {
  adminCreateSubject,
  adminDeleteSubject,
  adminGetLevelSubjects,
  adminListLevels,
  adminUpdateSubject,
} from "@/lib/api";
import type { Level, Subject } from "@/lib/api-types";
import { filterLevelsSDSMPSMA } from "@/features/admin/kelas-helpers";
import { useCallback, useEffect, useMemo, useState } from "react";

type KelasLevelListProps = {
  levelId: string;
  subjects: Subject[];
  subjectPage: number;
  onSubjectPageChange: (p: number) => void;
  openKelasEdit: (s: Subject, levelId: string) => void;
  handleDeleteKelas: (subjectId: string, levelId: string) => void;
};

function KelasLevelList({
  levelId,
  subjects,
  subjectPage,
  onSubjectPageChange,
  openKelasEdit,
  handleDeleteKelas,
}: KelasLevelListProps) {
  const paginated = useMemo(
    () => subjects.slice((subjectPage - 1) * PAGE_SIZE, subjectPage * PAGE_SIZE),
    [subjects, subjectPage]
  );

  useEffect(() => {
    if (subjects.length > 0 && (subjectPage - 1) * PAGE_SIZE >= subjects.length) {
      onSubjectPageChange(1);
    }
  }, [subjects.length, subjectPage, onSubjectPageChange]);

  return (
    <div>
      <ul className="space-y-2">
        {paginated.map((s) => (
          <li
            key={s.id}
            className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium text-zinc-900">{s.name}</p>
              {s.description && (
                <p className="mt-0.5 text-sm text-zinc-500 line-clamp-2">{s.description}</p>
              )}
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Link
                href={`/admin/master-data/kelas/${encodeURIComponent(s.id)}?levelId=${encodeURIComponent(levelId)}`}
                className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-50 hover:bg-zinc-800"
              >
                Kelola modul
              </Link>
              <button
                type="button"
                onClick={() => openKelasEdit(s, levelId)}
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Edit kelas
              </button>
              <button
                type="button"
                onClick={() => handleDeleteKelas(s.id, levelId)}
                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                Hapus
              </button>
            </div>
          </li>
        ))}
      </ul>
      {subjects.length > PAGE_SIZE && (
        <div className="mt-4">
          <Pagination
            currentPage={subjectPage}
            totalItems={subjects.length}
            onPageChange={onSubjectPageChange}
            label="kelas"
          />
        </div>
      )}
    </div>
  );
}

export default function MasterDataKelasListPage() {
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedLevelId, setExpandedLevelId] = useState<string | null>(null);
  const [subjectsByLevel, setSubjectsByLevel] = useState<Record<string, Subject[]>>({});

  const [kelasModalLevelId, setKelasModalLevelId] = useState<string | null>(null);
  const [kelasModalMode, setKelasModalMode] = useState<"add" | "edit" | null>(null);
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [kelasForm, setKelasForm] = useState({ name: "", slug: "", description: "" });

  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [subjectPage, setSubjectPage] = useState(1);

  const levelsSDSMPSMA = useMemo(() => filterLevelsSDSMPSMA(levels), [levels]);

  useEffect(() => {
    setSubjectPage(1);
  }, [expandedLevelId]);

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
      .then((list) => setSubjectsByLevel((prev) => ({ ...prev, [levelId]: list })))
      .catch(() => setSubjectsByLevel((prev) => ({ ...prev, [levelId]: [] })));
  }, []);

  const toggleLevel = (levelId: string) => {
    setExpandedLevelId((prev) => (prev === levelId ? null : levelId));
    if (!subjectsByLevel[levelId]) loadSubjects(levelId);
  };

  const openKelasAdd = (levelId: string) => {
    setKelasModalLevelId(levelId);
    setKelasForm({ name: "", slug: "", description: "" });
    setEditingSubjectId(null);
    setKelasModalMode("add");
    setSubmitError(null);
  };

  const openKelasEdit = (s: Subject, levelId: string) => {
    setKelasModalLevelId(levelId);
    setKelasForm({
      name: s.name,
      slug: s.slug ?? "",
      description: s.description ?? "",
    });
    setEditingSubjectId(s.id);
    setKelasModalMode("edit");
    setSubmitError(null);
  };

  const handleKelasSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const levelId = kelasModalLevelId;
    if (!levelId) return;
    setSubmitError(null);
    setSubmitLoading(true);
    try {
      if (kelasModalMode === "add") {
        await adminCreateSubject({
          name: kelasForm.name.trim(),
          slug: kelasForm.slug.trim() || undefined,
          description: kelasForm.description.trim() || undefined,
          levelId,
        });
      } else if (editingSubjectId) {
        await adminUpdateSubject(editingSubjectId, {
          name: kelasForm.name.trim(),
          slug: kelasForm.slug.trim() || undefined,
          description: kelasForm.description.trim() || undefined,
        });
      }
      setKelasModalLevelId(null);
      setKelasModalMode(null);
      setEditingSubjectId(null);
      loadSubjects(levelId);
    } catch (err) {
      setSubmitError((err as Error).message ?? "Gagal menyimpan");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteKelas = async (subjectId: string, levelId: string) => {
    if (!confirm("Hapus kelas ini? Semua modul di dalamnya ikut terhapus dari daftar.")) return;
    try {
      await adminDeleteSubject(subjectId);
      loadSubjects(levelId);
    } catch (err) {
      setError((err as Error).message ?? "Gagal menghapus");
    }
  };

  return (
    <div className="px-4 py-5 text-zinc-900 sm:px-6 md:px-8 md:py-8">
      <div className="mb-6 md:mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Master Data</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">Kelas</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Buat dan kelola kelas per jenjang (SD, SMP, SMA). Untuk menambah modul, buka halaman detail lewat tombol{" "}
          <strong className="font-medium text-zinc-800">Kelola modul</strong>.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500">
            Memuat level (SD, SMP, SMA)…
          </div>
        ) : levelsSDSMPSMA.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500">
            Belum ada level SD, SMP, atau SMA. Tambah jenjang di Master Data → Jenjang Pendidikan (slug: sd, smp, sma).
          </div>
        ) : (
          levelsSDSMPSMA.map((level) => (
            <div key={level.id} className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
                <button
                  type="button"
                  onClick={() => toggleLevel(level.id)}
                  className="flex flex-1 items-center gap-2 text-left"
                >
                  <span className="text-lg font-medium text-zinc-900">{level.name}</span>
                  {level.description && (
                    <span className="text-xs text-zinc-500">— {level.description}</span>
                  )}
                  <span className="text-zinc-400">{expandedLevelId === level.id ? "▼" : "▶"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => openKelasAdd(level.id)}
                  className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-50 hover:bg-zinc-800"
                >
                  + Tambah kelas
                </button>
              </div>

              {expandedLevelId === level.id && (
                <div className="border-t border-zinc-100 p-4">
                  {!subjectsByLevel[level.id] ? (
                    <p className="text-sm text-zinc-500">Memuat daftar kelas…</p>
                  ) : subjectsByLevel[level.id].length === 0 ? (
                    <p className="text-sm text-zinc-500">
                      Belum ada kelas. Klik &quot;+ Tambah kelas&quot;, lalu atur modul lewat &quot;Kelola modul&quot;.
                    </p>
                  ) : (
                    <KelasLevelList
                      levelId={level.id}
                      subjects={subjectsByLevel[level.id]}
                      subjectPage={subjectPage}
                      onSubjectPageChange={setSubjectPage}
                      openKelasEdit={openKelasEdit}
                      handleDeleteKelas={handleDeleteKelas}
                    />
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {kelasModalMode && kelasModalLevelId && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-zinc-900">
              {kelasModalMode === "add" ? "Tambah kelas" : "Edit kelas"}
            </h2>
            {submitError && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {submitError}
              </div>
            )}
            <form onSubmit={handleKelasSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-600">Nama kelas *</label>
                <input
                  type="text"
                  required
                  value={kelasForm.name}
                  onChange={(e) => setKelasForm({ ...kelasForm, name: e.target.value })}
                  placeholder="Mis. Algoritma Dasar"
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">Slug (opsional)</label>
                <input
                  type="text"
                  value={kelasForm.slug}
                  onChange={(e) => setKelasForm({ ...kelasForm, slug: e.target.value })}
                  placeholder="algoritma-dasar"
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">Deskripsi (opsional)</label>
                <textarea
                  rows={2}
                  value={kelasForm.description}
                  onChange={(e) => setKelasForm({ ...kelasForm, description: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setKelasModalLevelId(null);
                    setKelasModalMode(null);
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
                  {submitLoading ? "Menyimpan…" : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
