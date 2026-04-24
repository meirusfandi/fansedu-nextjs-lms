"use client";

import { FlashNoticeBar, useFlashNotice } from "@/components/FlashNotice";
import {
  adminGetLevelSubjects,
  adminCreateTryout,
  adminDeleteTryout,
  adminListLevels,
  adminListTryouts,
  adminUpdateTryout,
} from "@/lib/api";
import Link from "next/link";
import type {
  AdminCreateTryoutRequest,
  Level,
  TryoutSession,
} from "@/lib/api-types";
import { Pagination, PAGE_SIZE } from "@/components/Pagination";
import { useCallback, useEffect, useMemo, useState } from "react";
import { filterLevelsSDSMPSMA } from "@/features/admin/kelas-helpers";

const LEVEL_LABEL: Record<string, string> = {
  easy: "Mudah",
  medium: "Menengah",
  hard: "Sulit",
};
const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  open: "Dibuka",
  closed: "Ditutup",
};
const EVENT_CATEGORY_LABEL: Record<string, string> = {
  tryout: "Tryout",
  free_class: "Free Class",
  paid_class: "Paid Class",
};
const GRADING_MODE_LABEL: Record<string, string> = {
  auto: "Otomatis",
  manual: "Manual",
};

type SubjectRow = {
  id: string;
  name: string;
  levelId: string;
  levelName: string;
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("id-ID", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function toDatetimeLocalValue(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  // Hindari nilai sentinel backend seperti 0001-01-01T00:00:00Z (invalid untuk input datetime-local).
  if (y < 1000) return "";
  const pad = (n: number, size = 2) => String(n).padStart(size, "0");
  // Use local time so value is valid for <input type="datetime-local">
  return `${pad(y, 4)}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}

const emptyForm: AdminCreateTryoutRequest = {
  title: "",
  shortTitle: "",
  description: "",
  durationMinutes: 90,
  questionsCount: 25,
  level: "medium",
  levelId: "",
  levelName: "",
  subjectId: "",
  subject: "",
  opensAt: "",
  closesAt: "",
  maxParticipants: 200,
  status: "draft",
  gradingMode: "auto",
  eventCategory: "tryout",
};

export default function AdminTryoutsPage() {
  const { notice, showSuccess, clearNotice } = useFlashNotice();
  const [list, setList] = useState<TryoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState<"add" | "edit" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AdminCreateTryoutRequest>(emptyForm);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [levels, setLevels] = useState<Level[]>([]);
  const [subjectsFlat, setSubjectsFlat] = useState<SubjectRow[]>([]);
  const [metaLoading, setMetaLoading] = useState(true);
  const [filterLevelId, setFilterLevelId] = useState("");
  const [filterSubjectId, setFilterSubjectId] = useState("");

  const subjectOptions = useMemo(
    () =>
      (filterLevelId ? subjectsFlat.filter((s) => s.levelId === filterLevelId) : subjectsFlat).sort((a, b) =>
        a.name.localeCompare(b.name, "id")
      ),
    [subjectsFlat, filterLevelId]
  );
  const formSubjectOptions = useMemo(
    () =>
      (form.levelId ? subjectsFlat.filter((s) => s.levelId === form.levelId) : subjectsFlat).sort((a, b) =>
        a.name.localeCompare(b.name, "id")
      ),
    [subjectsFlat, form.levelId]
  );

  const filteredList = useMemo(() => {
    return list.filter((t) => {
      if (filterLevelId && (t.levelId ?? "") !== filterLevelId) return false;
      if (filterSubjectId && (t.subjectId ?? "") !== filterSubjectId) return false;
      return true;
    });
  }, [filterLevelId, filterSubjectId, list]);

  const paginatedList = useMemo(
    () => filteredList.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredList, page]
  );
  useEffect(() => {
    if (filteredList.length > 0 && (page - 1) * PAGE_SIZE >= filteredList.length) {
      setPage(1);
    }
  }, [filteredList.length, page]);
  useEffect(() => {
    if (filterSubjectId && !subjectOptions.some((s) => s.id === filterSubjectId)) {
      setFilterSubjectId("");
    }
  }, [filterSubjectId, subjectOptions]);
  useEffect(() => {
    if (form.subjectId && !formSubjectOptions.some((s) => s.id === form.subjectId)) {
      setForm((prev) => ({ ...prev, subjectId: "" }));
    }
  }, [form.subjectId, formSubjectOptions]);

  const loadList = useCallback(() => {
    setLoading(true);
    setError(null);
    adminListTryouts()
      .then((items) => {
        const unique = new Map<string, TryoutSession>();
        for (const item of items ?? []) {
          if (!item?.id) continue;
          unique.set(item.id, item);
        }
        setList(Array.from(unique.values()));
      })
      .catch((e) => {
        setError((e as Error).message ?? "Gagal memuat daftar event");
        setList([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const loadMeta = useCallback(async () => {
    setMetaLoading(true);
    try {
      const lv = await adminListLevels();
      const filteredLevels = filterLevelsSDSMPSMA(lv ?? []);
      const uniqueLevels = Array.from(new Map(filteredLevels.map((l) => [l.id, l])).values());
      const levelNameById = new Map(uniqueLevels.map((l) => [l.id, l.name]));
      const rows = await Promise.all(
        uniqueLevels.map(async (l) => {
          try {
            const subs = await adminGetLevelSubjects(l.id);
            return (subs ?? []).map((s) => {
              const resolvedLevelId = (s.levelId ?? "").trim() || l.id;
              return {
                id: s.id,
                name: s.name,
                levelId: resolvedLevelId,
                levelName: levelNameById.get(resolvedLevelId) ?? l.name,
              };
            });
          } catch {
            return [];
          }
        })
      );
      const uniqueSubjects = Array.from(
        new Map(
          rows
            .flat()
            .filter((s) => s.id && s.levelId)
            .map((s) => [`${s.levelId}::${s.id}`, s])
        ).values()
      );
      setLevels(uniqueLevels);
      setSubjectsFlat(uniqueSubjects);
    } catch {
      setLevels([]);
      setSubjectsFlat([]);
    } finally {
      setMetaLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMeta();
  }, [loadMeta]);

  const openAdd = () => {
    const now = new Date();
    const inAWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    setForm({
      ...emptyForm,
      opensAt: now.toISOString().slice(0, 16),
      closesAt: inAWeek.toISOString().slice(0, 16),
    });
    setEditingId(null);
    setSubmitError(null);
    setModalOpen("add");
  };

  const openEdit = (t: TryoutSession) => {
    setForm({
      title: t.title,
      shortTitle: t.shortTitle ?? "",
      description: t.description ?? "",
      durationMinutes: t.durationMinutes ?? 90,
      questionsCount: t.questionsCount ?? 25,
      level: t.level ?? "medium",
      levelId: t.levelId ?? "",
      levelName: t.levelName ?? "",
      subjectId: t.subjectId ?? "",
      subject: t.subjectName ?? "",
      opensAt: toDatetimeLocalValue(t.opensAt),
      closesAt: toDatetimeLocalValue(t.closesAt),
      maxParticipants: t.maxParticipants ?? undefined,
      status: t.status ?? "draft",
      gradingMode: t.gradingMode === "manual" ? "manual" : "auto",
      eventCategory: (t.eventCategory as "tryout" | "free_class" | "paid_class") ?? "tryout",
    });
    setEditingId(t.id);
    setSubmitError(null);
    setModalOpen("edit");
  };

  const closeModal = () => {
    setModalOpen(null);
    setEditingId(null);
    setSubmitError(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitLoading(true);
    const modalKind = modalOpen;
    try {
      const opensDate = form.opensAt ? new Date(form.opensAt) : null;
      const closesDate = form.closesAt ? new Date(form.closesAt) : null;
      const opensAt =
        opensDate && !Number.isNaN(opensDate.getTime())
          ? opensDate.toISOString()
          : "";
      const closesAt =
        closesDate && !Number.isNaN(closesDate.getTime())
          ? closesDate.toISOString()
          : "";
      if (!opensAt || !closesAt) {
        setSubmitError("Tanggal buka dan tutup wajib diisi.");
        return;
      }
      if (new Date(opensAt).getTime() >= new Date(closesAt).getTime()) {
        setSubmitError("Tanggal tutup harus setelah tanggal buka.");
        return;
      }

      const duration = Number(form.durationMinutes);
      const questionCount = Number(form.questionsCount);
      if (!Number.isFinite(duration) || duration <= 0) {
        setSubmitError("Durasi harus lebih dari 0.");
        return;
      }
      if (!Number.isFinite(questionCount) || questionCount <= 0) {
        setSubmitError("Jumlah soal harus lebih dari 0.");
        return;
      }

      // Resolve human-readable names from loaded dropdown data
      const resolvedLevelName =
        (form.levelId ?? "").trim()
          ? levels.find((l) => l.id === (form.levelId ?? "").trim())?.name ?? null
          : null;
      const resolvedSubjectName =
        (form.subjectId ?? "").trim()
          ? subjectsFlat.find((s) => s.id === (form.subjectId ?? "").trim())?.name ?? null
          : null;

      const payload: AdminCreateTryoutRequest = {
        title: form.title.trim(),
        durationMinutes: duration,
        questionsCount: questionCount,
        level: form.level,
        levelId: form.levelId?.trim() ? form.levelId.trim() : null,
        levelName: resolvedLevelName,
        subjectId: form.subjectId?.trim() ? form.subjectId.trim() : null,
        subject: resolvedSubjectName,
        opensAt: opensAt,
        closesAt: closesAt,
        status: form.status ?? "draft",
        // Kirim eksplisit agar update create/update konsisten.
        shortTitle: form.shortTitle?.trim() ? form.shortTitle.trim() : null,
        description: form.description?.trim() ? form.description.trim() : null,
        maxParticipants:
          form.maxParticipants != null && Number(form.maxParticipants) > 0
            ? Number(form.maxParticipants)
            : null,
        eventCategory: form.eventCategory ?? "tryout",
        gradingMode: form.gradingMode ?? "auto",
      };
      if (modalOpen === "add") {
        await adminCreateTryout(payload);
      } else if (editingId) {
        await adminUpdateTryout(editingId, payload);
      }
      closeModal();
      loadList();
      setError(null);
      showSuccess(
        modalKind === "add" ? "Event berhasil ditambahkan." : "Event berhasil diperbarui."
      );
    } catch (err) {
      const msg = (err as Error).message ?? "Gagal menyimpan";
      setSubmitError(msg);
      setError(msg);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminDeleteTryout(id);
      setDeleteConfirm(null);
      loadList();
      setError(null);
      showSuccess("Event berhasil dihapus.");
    } catch (err) {
      setError((err as Error).message ?? "Gagal menghapus");
    }
  };

  return (
    <div className="px-4 py-5 sm:px-6 md:px-8 md:py-8">
        <div className="mb-6 flex items-center justify-between md:mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Manage
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
              Event
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Daftar event (tryout, free class, paid class). Kelola soal via Kelola Soal.
            </p>
          </div>
          <button
            type="button"
            onClick={openAdd}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 shadow-sm hover:bg-zinc-800"
          >
            + Tambah Event
          </button>
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

        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="grid grid-cols-1 gap-3 border-b border-zinc-200 bg-zinc-50 p-4 md:grid-cols-4">
            <div>
              <label className="block text-xs font-medium text-zinc-600">Filter Jenjang</label>
              <select
                value={filterLevelId}
                onChange={(e) => setFilterLevelId(e.target.value)}
                disabled={metaLoading}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 disabled:cursor-not-allowed disabled:bg-zinc-100"
              >
                <option value="">Semua Jenjang</option>
                {levels.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600">Filter Subject</label>
              <select
                value={filterSubjectId}
                onChange={(e) => setFilterSubjectId(e.target.value)}
                disabled={metaLoading}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 disabled:cursor-not-allowed disabled:bg-zinc-100"
              >
                <option value="">Semua Subject</option>
                {subjectOptions.map((s) => (
                  <option key={`${s.levelId}-${s.id}`} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {loading ? (
            <div className="p-8 text-center text-sm text-zinc-500">
              Memuat daftar tryout...
            </div>
          ) : filteredList.length === 0 ? (
            <div className="p-8 text-center text-sm text-zinc-500">
              {list.length === 0
                ? "Belum ada event. Klik \"Tambah Event\" untuk membuat."
                : "Tidak ada event yang cocok dengan filter saat ini."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-200 text-sm">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-zinc-500">
                      Judul
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-500">
                      Kategori
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-500">
                      Short
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-500">
                      Durasi
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-500">
                      Soal
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-500">
                      Level
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-500">
                      Jenjang
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-500">
                      Subject
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-500">
                      Penilaian
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-500">
                      Buka – Tutup
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-zinc-500">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {paginatedList.map((t) => (
                    <tr
                      key={t.id}
                      className="hover:bg-zinc-50"
                    >
                      <td className="px-4 py-3 font-medium text-zinc-900">
                        {t.title}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
                          {EVENT_CATEGORY_LABEL[t.eventCategory ?? "tryout"] ?? t.eventCategory ?? "Tryout"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        {t.shortTitle ?? "–"}
                      </td>
                      <td className="px-4 py-3">{t.durationMinutes} mnt</td>
                      <td className="px-4 py-3">{t.questionsCount}</td>
                      <td className="px-4 py-3">
                        {LEVEL_LABEL[t.level] ?? t.level}
                      </td>
                      <td className="px-4 py-3">{t.levelName ? t.levelName.toUpperCase() : "–"}</td>
                      <td className="px-4 py-3">{t.subjectName ?? "–"}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
                          {STATUS_LABEL[t.status] ?? t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
                          {GRADING_MODE_LABEL[t.gradingMode === "manual" ? "manual" : "auto"]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-500">
                        {formatDate(t.opensAt)} – {formatDate(t.closesAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/tryouts/${t.id}/detail`}
                          className="mr-2 text-zinc-600 underline hover:text-zinc-900"
                        >
                          Lihat detail
                        </Link>
                        <Link
                          href={`/admin/tryouts/${t.id}/soal`}
                          className="mr-2 text-zinc-600 underline hover:text-zinc-900"
                        >
                          Kelola Soal
                        </Link>
                        <button
                          type="button"
                          onClick={() => openEdit(t)}
                          className="mr-2 text-zinc-600 underline hover:text-zinc-900"
                        >
                          Edit
                        </button>
                        {deleteConfirm === t.id ? (
                          <>
                            <span className="text-zinc-400">|</span>
                            <button
                              type="button"
                              onClick={() => handleDelete(t.id)}
                              className="ml-2 text-red-600 hover:underline"
                            >
                              Ya, hapus
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirm(null)}
                              className="ml-2 text-zinc-500 hover:underline"
                            >
                              Batal
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirm(t.id)}
                            className="text-red-600 hover:underline"
                          >
                            Hapus
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!loading && filteredList.length > 0 && (
            <Pagination
              currentPage={page}
              totalItems={filteredList.length}
              onPageChange={setPage}
              label="event"
            />
          )}
        </div>

      {/* Modal Tambah / Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-900 shadow-xl [color-scheme:light]">
            <h2 className="text-lg font-semibold text-zinc-900">
              {modalOpen === "add" ? "Tambah Event" : "Edit Event"}
            </h2>
            {submitError && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {submitError}
              </div>
            )}
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-600">
                  Judul *
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">
                  Kategori Event *
                </label>
                <select
                  value={form.eventCategory ?? "tryout"}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      eventCategory: e.target.value as "tryout" | "free_class" | "paid_class",
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                >
                  <option value="tryout">Tryout</option>
                  <option value="free_class">Free Class</option>
                  <option value="paid_class">Paid Class</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">
                  Judul singkat
                </label>
                <input
                  type="text"
                  value={form.shortTitle ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, shortTitle: e.target.value || undefined })
                  }
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">
                  Deskripsi
                </label>
                <textarea
                  rows={2}
                  value={form.description ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value || undefined })
                  }
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-600">
                    Durasi (menit) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={form.durationMinutes ?? 90}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        durationMinutes: Number(e.target.value) || 90,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600">
                    Jumlah soal *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={form.questionsCount ?? 25}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        questionsCount: Number(e.target.value) || 25,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-600">
                    Jenjang *
                  </label>
                  <select
                    value={form.levelId ?? ""}
                    required
                    onChange={(e) =>
                      setForm({
                        ...form,
                        levelId: e.target.value,
                        subjectId: "",
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                  >
                    <option value="">Pilih jenjang</option>
                    {levels.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600">
                    Subject *
                  </label>
                  <select
                    value={form.subjectId ?? ""}
                    required
                    disabled={!form.levelId}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        subjectId: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 disabled:cursor-not-allowed disabled:bg-zinc-100"
                  >
                    <option value="">{form.levelId ? "Pilih subject" : "Pilih jenjang dulu"}</option>
                    {formSubjectOptions.map((s) => (
                      <option key={`${s.levelId}-${s.id}`} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-600">
                    Level
                  </label>
                  <select
                    value={form.level ?? "medium"}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        level: e.target.value as "easy" | "medium" | "hard",
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                  >
                    <option value="easy">Mudah</option>
                    <option value="medium">Menengah</option>
                    <option value="hard">Sulit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600">
                    Status
                  </label>
                  <select
                    value={form.status ?? "draft"}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        status: e.target.value as "draft" | "open" | "closed",
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                  >
                    <option value="draft">Draft</option>
                    <option value="open">Dibuka</option>
                    <option value="closed">Ditutup</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">
                  Mode penilaian
                </label>
                <select
                  value={form.gradingMode ?? "auto"}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      gradingMode: e.target.value as "auto" | "manual",
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                >
                  <option value="auto">Otomatis (kunci jawaban)</option>
                  <option value="manual">Manual (review pengajar)</option>
                </select>
                <p className="mt-1 text-[11px] text-zinc-500">
                  Mode otomatis memerlukan kunci lengkap per soal; backend menolak jika belum lengkap.
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">
                  Buka (tanggal & waktu)
                </label>
                <input
                  type="datetime-local"
                  required
                  value={form.opensAt}
                  onChange={(e) => setForm({ ...form, opensAt: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">
                  Tutup (tanggal & waktu)
                </label>
                <input
                  type="datetime-local"
                  required
                  value={form.closesAt}
                  onChange={(e) =>
                    setForm({ ...form, closesAt: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">
                  Max peserta (opsional)
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.maxParticipants ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      maxParticipants: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
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
