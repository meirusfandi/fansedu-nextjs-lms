"use client";

import { FlashNoticeBar, useFlashNotice } from "@/components/FlashNotice";
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

type FlatBidang = Subject & { levelId: string; levelName: string };

export default function MasterDataBidangListPage() {
  const { notice, showSuccess, clearNotice } = useFlashNotice();
  const [levels, setLevels] = useState<Level[]>([]);
  const [subjectsByLevel, setSubjectsByLevel] = useState<Record<string, Subject[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterLevelId, setFilterLevelId] = useState("");
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [form, setForm] = useState({
    levelId: "",
    name: "",
    slug: "",
    description: "",
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const levelsSDSMPSMA = useMemo(() => filterLevelsSDSMPSMA(levels), [levels]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const lv = await adminListLevels();
      const filtered = filterLevelsSDSMPSMA(lv ?? []);
      setLevels(filtered);

      const entries = await Promise.all(
        filtered.map(async (l) => {
          try {
            const subjects = await adminGetLevelSubjects(l.id);
            return [l.id, subjects ?? []] as const;
          } catch {
            return [l.id, []] as const;
          }
        })
      );
      const map: Record<string, Subject[]> = {};
      for (const [id, rows] of entries) map[id] = rows;
      setSubjectsByLevel(map);
    } catch (e) {
      setError((e as Error).message ?? "Gagal memuat data bidang");
      setLevels([]);
      setSubjectsByLevel({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const flatRows = useMemo<FlatBidang[]>(() => {
    const out: FlatBidang[] = [];
    for (const level of levelsSDSMPSMA) {
      const rows = subjectsByLevel[level.id] ?? [];
      for (const s of rows) {
        out.push({ ...s, levelId: level.id, levelName: level.name });
      }
    }
    out.sort((a, b) => a.name.localeCompare(b.name));
    return out;
  }, [levelsSDSMPSMA, subjectsByLevel]);

  const filteredRows = useMemo(() => {
    if (!filterLevelId) return flatRows;
    return flatRows.filter((r) => r.levelId === filterLevelId);
  }, [flatRows, filterLevelId]);

  const paginatedRows = useMemo(
    () => filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredRows, page]
  );

  useEffect(() => {
    setPage(1);
  }, [filterLevelId]);

  useEffect(() => {
    if (filteredRows.length > 0 && (page - 1) * PAGE_SIZE >= filteredRows.length) {
      setPage(1);
    }
  }, [filteredRows.length, page]);

  const openAdd = () => {
    setModalMode("add");
    setEditingSubjectId(null);
    setForm({
      levelId: filterLevelId || "",
      name: "",
      slug: "",
      description: "",
    });
    setSubmitError(null);
    setModalOpen(true);
  };

  const openEdit = (row: FlatBidang) => {
    setModalMode("edit");
    setEditingSubjectId(row.id);
    setForm({
      levelId: row.levelId,
      name: row.name,
      slug: row.slug ?? "",
      description: row.description ?? "",
    });
    setSubmitError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSubmitError(null);
    setEditingSubjectId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.levelId.trim()) {
      setSubmitError("Jenjang pendidikan wajib dipilih.");
      return;
    }
    setSubmitError(null);
    setSubmitLoading(true);
    try {
      if (modalMode === "add") {
        await adminCreateSubject({
          levelId: form.levelId.trim(),
          name: form.name.trim(),
          slug: form.slug.trim() || undefined,
          description: form.description.trim() || undefined,
        });
        showSuccess("Bidang berhasil ditambahkan.");
      } else if (editingSubjectId) {
        await adminUpdateSubject(editingSubjectId, {
          name: form.name.trim(),
          slug: form.slug.trim() || undefined,
          description: form.description.trim() || undefined,
        });
        showSuccess("Bidang berhasil diperbarui.");
      }
      closeModal();
      await loadAll();
    } catch (err) {
      setSubmitError((err as Error).message ?? "Gagal menyimpan bidang.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (row: FlatBidang) => {
    if (!confirm(`Hapus bidang "${row.name}"?`)) return;
    try {
      await adminDeleteSubject(row.id);
      showSuccess("Bidang berhasil dihapus.");
      await loadAll();
    } catch (err) {
      setError((err as Error).message ?? "Gagal menghapus bidang.");
    }
  };

  return (
    <div className="px-4 py-5 text-zinc-900 sm:px-6 md:px-8 md:py-8">
      <div className="mb-6 md:mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Master Data</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">Bidang</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Daftar bidang ditampilkan dalam satu list. Filter jenjang tersedia untuk mempersempit data.
        </p>
      </div>

      {notice && (
        <div className="mb-4">
          <FlashNoticeBar kind={notice.kind} message={notice.text} onDismiss={clearNotice} />
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div>
          <label className="block text-xs font-medium text-zinc-600">Filter jenjang pendidikan</label>
          <select
            value={filterLevelId}
            onChange={(e) => setFilterLevelId(e.target.value)}
            className="mt-1 w-full min-w-[240px] rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
          >
            <option value="">Semua jenjang</option>
            {levelsSDSMPSMA.map((level, idx) => (
              <option key={`${level.id}-${idx}`} value={level.id}>
                {level.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 hover:bg-zinc-800"
        >
          + Tambah bidang
        </button>
      </div>

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-900">
          Daftar bidang
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm text-zinc-500">Memuat data bidang…</div>
        ) : filteredRows.length === 0 ? (
          <div className="p-8 text-center text-sm text-zinc-500">Belum ada bidang untuk filter ini.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-200 text-sm">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-zinc-600">Bidang</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-600">Jenjang</th>
                    <th className="px-4 py-3 text-right font-medium text-zinc-600">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {paginatedRows.map((row, idx) => (
                    <tr key={`${row.levelId}-${row.id}-${idx}`} className="hover:bg-zinc-50/80">
                      <td className="px-4 py-3">
                        <div className="font-medium text-zinc-900">{row.name}</div>
                        {row.description ? (
                          <div className="text-xs text-zinc-500 line-clamp-2">{row.description}</div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-zinc-700">{row.levelName}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => openEdit(row)}
                          className="mr-2 text-xs text-sky-700 underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(row)}
                          className="text-xs text-red-600 underline"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={page}
              totalItems={filteredRows.length}
              onPageChange={setPage}
              label="bidang"
            />
          </>
        )}
      </section>

      {modalOpen && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-zinc-900">
              {modalMode === "add" ? "Tambah bidang" : "Edit bidang"}
            </h2>
            {submitError && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {submitError}
              </div>
            )}
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-600">Jenjang pendidikan *</label>
                <select
                  value={form.levelId}
                  onChange={(e) => setForm((f) => ({ ...f, levelId: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
                  required
                >
                  <option value="">— Pilih jenjang —</option>
                  {levelsSDSMPSMA.map((level, idx) => (
                    <option key={`${level.id}-${idx}`} value={level.id}>
                      {level.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">Nama bidang *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">Slug (opsional)</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">Deskripsi (opsional)</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-zinc-50 hover:bg-zinc-800 disabled:opacity-50"
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

