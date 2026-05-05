"use client";

import { FlashNoticeBar, useFlashNotice } from "@/components/FlashNotice";
import { Pagination, PAGE_SIZE } from "@/components/Pagination";
import { OSN_PREP_CURRICULUM_MODULES } from "@/data/osn-class-curriculum";
import {
  courseStatusFromApi,
  emptyClassForm,
  statusLabel,
  statusBadgeClass,
  type CourseFormStatus,
} from "@/features/admin/kelas-admin-ui";
import { useAdminLocalClasses, type AddCourseInput } from "@/features/admin/useAdminLocalClasses";
import {
  adminAddCourseContent,
  adminGetLevelSubjects,
  adminGetSubject,
  adminListLevels,
  adminListVouchers,
  getFriendlyApiErrorMessage,
} from "@/lib/api";
import type { AdminVoucher, Course, Level, Subject } from "@/lib/api-types";
import { formatDiscountDisplay, isAdminVoucherCurrentlyValid } from "@/lib/voucher-utils";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function AdminKelasListPage() {
  const { classes, loading, saving, apiError, addCourse, updateCourse, deleteCourse, reload } =
    useAdminLocalClasses();
  const { notice, showSuccess, clearNotice } = useFlashNotice();
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [levels, setLevels] = useState<Level[]>([]);
  const [subjectsByLevel, setSubjectsByLevel] = useState<Record<string, Subject[]>>({});
  const [subjectById, setSubjectById] = useState<Record<string, Subject>>({});
  const [filterLevelId, setFilterLevelId] = useState("");
  const [filterSubjectId, setFilterSubjectId] = useState("");

  const [classModalMode, setClassModalMode] = useState<"add" | "edit" | null>(null);
  const [classForm, setClassForm] = useState(emptyClassForm);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [courseVouchers, setCourseVouchers] = useState<AdminVoucher[]>([]);

  useEffect(() => {
    adminListVouchers()
      .then((all) =>
        setCourseVouchers(
          all.filter((v) => v.appliesToCourses && isAdminVoucherCurrentlyValid(v))
        )
      )
      .catch(() => setCourseVouchers([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    adminListLevels()
      .then((lvls) => {
        if (cancelled) return;
        setLevels(lvls ?? []);
        if (!lvls?.length) return;
        return Promise.all(
          lvls.map((l) =>
            adminGetLevelSubjects(l.id).then((rows) => [l.id, rows ?? []] as const)
          )
        ).then((entries) => {
          if (cancelled) return;
          setSubjectsByLevel((prev) => {
            const next = { ...prev };
            for (const [lid, rows] of entries) {
              next[lid] = rows;
            }
            return next;
          });
        });
      })
      .catch(() => setLevels([]));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const lid = classForm.levelId?.trim();
    if (!lid || subjectsByLevel[lid]) return;
    adminGetLevelSubjects(lid)
      .then((rows) => setSubjectsByLevel((prev) => ({ ...prev, [lid]: rows ?? [] })))
      .catch(() => setSubjectsByLevel((prev) => ({ ...prev, [lid]: [] })));
  }, [classForm.levelId, subjectsByLevel]);

  useEffect(() => {
    const ids = [...new Set(classes.map((c) => c.subjectId).filter(Boolean) as string[])];
    for (const id of ids) {
      void adminGetSubject(id).then((s) => {
        if (s) setSubjectById((prev) => ({ ...prev, [id]: s }));
      });
    }
  }, [classes]);

  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
      if (filterSubjectId && c.subjectId !== filterSubjectId) return false;
      if (filterLevelId) {
        if (!c.subjectId) return false;
        const subj = subjectById[c.subjectId];
        if (subj && subj.levelId !== filterLevelId) return false;
        if (!subj) return true;
      }
      return true;
    });
  }, [classes, filterLevelId, filterSubjectId, subjectById]);

  const paginated = useMemo(
    () => filteredClasses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredClasses, page]
  );

  useEffect(() => {
    if (filteredClasses.length > 0 && (page - 1) * PAGE_SIZE >= filteredClasses.length) {
      setPage(1);
    }
  }, [filteredClasses.length, page]);

  const openAddClass = () => {
    setClassForm(emptyClassForm);
    setClassModalMode("add");
    setEditingClassId(null);
    setError(null);
  };

  const openEditClass = (c: Course) => {
    const sub = c.subjectId ? subjectById[c.subjectId] : undefined;
    setClassForm({
      title: c.title,
      description: c.description ?? "",
      levelId: sub?.levelId ?? "",
      subjectId: c.subjectId ?? "",
      trainerId: "",
      startDate: "",
      endDate: "",
      status: courseStatusFromApi(c.status),
    });
    setEditingClassId(c.id);
    setClassModalMode("edit");
    setError(null);
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!classForm.title.trim()) {
      setError("Judul kelas wajib diisi.");
      return;
    }

    const input: AddCourseInput = {
      title: classForm.title,
      description: classForm.description,
      subjectId: classForm.subjectId,
      status: classForm.status,
    };

    try {
      if (classModalMode === "add") {
        await addCourse(input);
        showSuccess("Kelas berhasil ditambahkan.");
      } else if (classModalMode === "edit" && editingClassId) {
        await updateCourse(editingClassId, input);
        showSuccess("Kelas berhasil diperbarui.");
      }
      setClassModalMode(null);
    } catch (e) {
      setError(getFriendlyApiErrorMessage(e));
    }
  };

  const handleDeleteClass = async (id: string) => {
    if (!confirm("Hapus kelas ini beserta konten di server?")) return;
    try {
      await deleteCourse(id);
      showSuccess("Kelas berhasil dihapus.");
    } catch (e) {
      setError(getFriendlyApiErrorMessage(e));
    }
  };

  const handleImportOsnPrepClass = async () => {
    if (
      !confirm(
        "Buat kelas baru berisi 8 modul materi persiapan OSN-K (Computational Thinking → Strategi ujian)? Kelas lama tidak diubah."
      )
    ) {
      return;
    }
    setError(null);
    try {
      const newClass = await addCourse({
        title: "Persiapan OSN-K (Kurikulum contoh)",
        description:
          "Delapan sesi: CT, Himpunan & Boolean, Kombinatorika, Deret & model matematis, Graf & geometri, C++ dasar, Array & rekursi, review tryout & strategi.",
        subjectId: "",
        status: "draft",
      });

      let order = 0;
      for (const spec of OSN_PREP_CURRICULUM_MODULES) {
        order += 1;
        await adminAddCourseContent(newClass.id, {
          type: "module",
          title: spec.title,
          description: spec.focus,
          body: spec.lessonBody,
          sortOrder: order,
        });
      }
      await reload();
      showSuccess("Kelas contoh OSN-K berhasil ditambahkan.");
    } catch (e) {
      setError(getFriendlyApiErrorMessage(e));
    }
  };

  // ------------- Loading skeleton -------------
  if (loading) {
    return (
      <div className="px-4 py-5 sm:px-6 md:px-8 md:py-8">
        <div className="mb-8">
          <div className="h-3 w-20 animate-pulse rounded bg-zinc-200" />
          <div className="mt-2 h-7 w-52 animate-pulse rounded bg-zinc-200" />
          <div className="mt-2 h-4 w-80 animate-pulse rounded bg-zinc-100" />
        </div>
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-100 px-4 py-3">
            <div className="h-4 w-24 animate-pulse rounded bg-zinc-200" />
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-4 border-b border-zinc-100 px-4 py-3">
              <div className="flex-1">
                <div className="h-4 w-48 animate-pulse rounded bg-zinc-200" />
                <div className="mt-1 h-3 w-32 animate-pulse rounded bg-zinc-100" />
              </div>
              <div className="h-4 w-20 animate-pulse rounded bg-zinc-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-5 sm:px-6 md:px-8 md:py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 md:mb-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Manage</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
            Management Kelas
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Kelas dan konten materi disimpan di server. Promo diskon dikelola di{" "}
            <Link href="/admin/vouchers" className="font-medium text-emerald-700 underline">
              Voucher
            </Link>
            .
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleImportOsnPrepClass}
            disabled={saving}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
          >
            Impor materi OSN (8 modul)
          </button>
          <button
            type="button"
            onClick={openAddClass}
            disabled={saving}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 hover:bg-zinc-800 disabled:opacity-50"
          >
            + Tambah Kelas
          </button>
        </div>
      </div>

      {notice && (
        <div className="mb-4">
          <FlashNoticeBar kind={notice.kind} message={notice.text} onDismiss={clearNotice} />
        </div>
      )}

      {(error || apiError) && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error ?? apiError}
        </div>
      )}

      {courseVouchers.length > 0 && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-950">
          <span className="font-medium">Promo aktif untuk checkout kelas: </span>
          <span className="font-mono text-xs">
            {courseVouchers.map((v) => `${v.code} (${formatDiscountDisplay(v)})`).join(" · ")}
          </span>
          <Link href="/admin/vouchers" className="ml-2 font-medium text-emerald-800 underline">
            Kelola
          </Link>
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-900">Daftar kelas</div>
        <div className="grid grid-cols-1 gap-3 border-b border-zinc-100 bg-zinc-50/60 px-4 py-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-zinc-600">Filter jenjang pendidikan</label>
            <select
              value={filterLevelId}
              onChange={(e) => {
                const lid = e.target.value;
                setFilterLevelId(lid);
                setFilterSubjectId("");
                if (lid && !subjectsByLevel[lid]) {
                  adminGetLevelSubjects(lid)
                    .then((rows) => setSubjectsByLevel((prev) => ({ ...prev, [lid]: rows ?? [] })))
                    .catch(() => setSubjectsByLevel((prev) => ({ ...prev, [lid]: [] })));
                }
              }}
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">Semua jenjang</option>
              {levels.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">Filter bidang</label>
            <select
              value={filterSubjectId}
              onChange={(e) => setFilterSubjectId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">Semua bidang</option>
              {(filterLevelId ? subjectsByLevel[filterLevelId] ?? [] : []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        {filteredClasses.length === 0 ? (
          <div className="p-6 text-sm text-zinc-600">Belum ada kelas. Klik &quot;Tambah Kelas&quot;.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-200 text-sm">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-zinc-600">Kelas</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-600">Bidang / Jenjang</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-600">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-600">Konten</th>
                    <th className="px-4 py-3 text-right font-medium text-zinc-600">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {paginated.map((c) => {
                    const sub = c.subjectId ? subjectById[c.subjectId] : undefined;
                    const levelName = sub?.levelId
                      ? levels.find((l) => l.id === sub.levelId)?.name ?? "—"
                      : "—";
                    return (
                    <tr key={c.id} className="hover:bg-zinc-50/80">
                      <td className="px-4 py-3">
                        <p className="font-medium text-zinc-900">{c.title}</p>
                        <p className="text-xs text-zinc-500">
                          {sub?.name ?? (c.subjectId ? "Memuat bidang…" : "Tanpa bidang")}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-600">
                        <div>{sub?.name ?? "—"}</div>
                        <div>{levelName}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(c.status)}`}>
                          {statusLabel(c.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/kelas/${encodeURIComponent(c.id)}`}
                          className="inline-flex rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
                        >
                          Kelola konten
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => openEditClass(c)}
                          disabled={saving}
                          className="mr-2 text-xs text-sky-700 hover:underline disabled:opacity-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClass(c.id)}
                          disabled={saving}
                          className="text-xs text-red-600 hover:underline disabled:opacity-50"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={page} totalItems={filteredClasses.length} onPageChange={setPage} label="kelas" />
          </>
        )}
      </section>

      {classModalMode && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-zinc-900">
              {classModalMode === "add" ? "Tambah Kelas" : "Edit Kelas"}
            </h3>
            {error && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
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
                  <label className="block text-xs font-medium text-zinc-600">Jenjang pendidikan</label>
                  <select
                    value={classForm.levelId}
                    onChange={(e) =>
                      setClassForm((f) => ({ ...f, levelId: e.target.value, subjectId: "" }))
                    }
                    className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                  >
                    <option value="">— Pilih jenjang —</option>
                    {levels.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600">Bidang</label>
                  <select
                    value={classForm.subjectId}
                    onChange={(e) => setClassForm((f) => ({ ...f, subjectId: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                    disabled={!classForm.levelId}
                  >
                    <option value="">— Pilih bidang —</option>
                    {(classForm.levelId ? subjectsByLevel[classForm.levelId] ?? [] : []).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">Status</label>
                <select
                  value={classForm.status}
                  onChange={(e) =>
                    setClassForm((f) => ({ ...f, status: e.target.value as CourseFormStatus }))
                  }
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="publish">Published</option>
                  <option value="active">Aktif</option>
                  <option value="archived">Diarsipkan</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => { setClassModalMode(null); setError(null); }}
                  disabled={saving}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 disabled:opacity-50"
                >
                  {saving && (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  )}
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

