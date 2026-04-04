"use client";

import { Pagination, PAGE_SIZE } from "@/components/Pagination";
import { OSN_PREP_CURRICULUM_MODULES } from "@/data/osn-class-curriculum";
import {
  emptyClassForm,
  type AdminClass,
  type ClassModule,
  nowIso,
  statusLabel,
  uid,
} from "@/features/admin/local-kelas-storage";
import { useAdminLocalClasses } from "@/features/admin/useAdminLocalClasses";
import { adminListUsers, getFriendlyApiErrorMessage } from "@/lib/api";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function AdminKelasListPage() {
  const { classes, setClasses } = useAdminLocalClasses();
  const [trainers, setTrainers] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const [classModalMode, setClassModalMode] = useState<"add" | "edit" | null>(null);
  const [classForm, setClassForm] = useState(emptyClassForm);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);

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
        setError(getFriendlyApiErrorMessage(e));
        setTrainers([]);
      });
  }, []);

  const paginated = useMemo(
    () => classes.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [classes, page]
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
    } else if (classModalMode === "edit" && editingClassId) {
      setClasses((prev) =>
        prev.map((c) =>
          c.id === editingClassId
            ? {
                ...c,
                title: classForm.title.trim(),
                description: classForm.description.trim() || undefined,
                trainerId: classForm.trainerId || undefined,
                trainerName:
                  (trainers.find((t) => t.id === classForm.trainerId)?.name ?? c.trainerName) || undefined,
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
            Daftar kelas (disimpan di browser). Untuk mengatur <strong>module, konten, dan materi</strong>, buka{" "}
            <strong>Kelola modul</strong> pada baris kelas. Untuk kelas dari Master Data (API), gunakan{" "}
            <Link href="/admin/master-data/kelas" className="font-medium text-emerald-700 underline">
              Master Data → Kelas
            </Link>
            .
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

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-900">Daftar kelas</div>
        {classes.length === 0 ? (
          <div className="p-6 text-sm text-zinc-600">Belum ada kelas. Klik &quot;Tambah Kelas&quot;.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-200 text-sm">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-zinc-600">Kelas</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-600">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-600">Modul</th>
                    <th className="px-4 py-3 text-right font-medium text-zinc-600">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {paginated.map((c) => (
                    <tr key={c.id} className="hover:bg-zinc-50/80">
                      <td className="px-4 py-3">
                        <p className="font-medium text-zinc-900">{c.title}</p>
                        <p className="text-xs text-zinc-500">{c.trainerName ?? "Trainer belum ditentukan"}</p>
                      </td>
                      <td className="px-4 py-3 text-zinc-700">{statusLabel(c.status)}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/kelas/${encodeURIComponent(c.id)}`}
                          className="inline-flex rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
                        >
                          Kelola modul
                        </Link>
                        <span className="ml-2 text-xs text-zinc-500">({c.modules.length})</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => openEditClass(c)}
                          className="mr-2 text-xs text-sky-700 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClass(c.id)}
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
                      Belum ada user role trainer/pengajar atau gagal memuat daftar. Kelas tetap bisa disimpan tanpa
                      trainer.
                    </p>
                  ) : null}
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600">Status</label>
                  <select
                    value={classForm.status}
                    onChange={(e) =>
                      setClassForm((f) => ({ ...f, status: e.target.value as AdminClass["status"] }))
                    }
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
    </div>
  );
}
