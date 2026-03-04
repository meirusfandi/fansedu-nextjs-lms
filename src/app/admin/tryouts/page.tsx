"use client";

import {
  adminCreateTryout,
  adminDeleteTryout,
  adminListTryouts,
  adminUpdateTryout,
  logout,
  clearAuthToken,
} from "@/lib/api";
import type {
  AdminCreateTryoutRequest,
  TryoutSession,
} from "@/lib/api-types";
import { AdminSidebar } from "@/components/AdminSidebar";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

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

const emptyForm: AdminCreateTryoutRequest = {
  title: "",
  short_title: "",
  description: "",
  duration_minutes: 90,
  questions_count: 25,
  level: "medium",
  opens_at: "",
  closes_at: "",
  max_participants: 200,
  status: "draft",
};

export default function AdminTryoutsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [list, setList] = useState<TryoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState<"add" | "edit" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AdminCreateTryoutRequest>(emptyForm);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleLogout = useCallback(() => {
    logout().catch(() => {});
    clearAuthToken();
    router.push("/login");
  }, [router]);

  const loadList = useCallback(() => {
    setLoading(true);
    setError(null);
    adminListTryouts()
      .then(setList)
      .catch((e) => {
        setError((e as Error).message ?? "Gagal memuat daftar tryout");
        setList([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const openAdd = () => {
    const now = new Date();
    const inAWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    setForm({
      ...emptyForm,
      opens_at: now.toISOString().slice(0, 16),
      closes_at: inAWeek.toISOString().slice(0, 16),
    });
    setEditingId(null);
    setSubmitError(null);
    setModalOpen("add");
  };

  const openEdit = (t: TryoutSession) => {
    setForm({
      title: t.title,
      short_title: t.short_title ?? "",
      description: t.description ?? "",
      duration_minutes: t.duration_minutes,
      questions_count: t.questions_count,
      level: t.level,
      opens_at: t.opens_at.slice(0, 16),
      closes_at: t.closes_at.slice(0, 16),
      max_participants: t.max_participants ?? undefined,
      status: t.status,
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
    try {
      const opensAt = form.opens_at ? new Date(form.opens_at).toISOString() : "";
      const closesAt = form.closes_at ? new Date(form.closes_at).toISOString() : "";
      if (!opensAt || !closesAt) {
        setSubmitError("Tanggal buka dan tutup wajib diisi.");
        return;
      }
      const payload: AdminCreateTryoutRequest = {
        title: form.title.trim(),
        duration_minutes: Number(form.duration_minutes) || 90,
        questions_count: Number(form.questions_count) || 25,
        level: form.level,
        opens_at: opensAt,
        closes_at: closesAt,
        status: form.status ?? "draft",
      };
      if (form.short_title?.trim()) payload.short_title = form.short_title.trim();
      if (form.description?.trim()) payload.description = form.description.trim();
      if (form.max_participants != null && form.max_participants > 0) {
        payload.max_participants = Number(form.max_participants);
      }
      if (modalOpen === "add") {
        await adminCreateTryout(payload);
      } else if (editingId) {
        await adminUpdateTryout(editingId, payload);
      }
      closeModal();
      loadList();
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
    } catch (err) {
      setError((err as Error).message ?? "Gagal menghapus");
    }
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
              Kelola Tryout
            </h1>
          </div>
          <button
            type="button"
            onClick={openAdd}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 shadow-sm hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            + Tambah Tryout
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          {loading ? (
            <div className="p-8 text-center text-sm text-zinc-500">
              Memuat daftar tryout...
            </div>
          ) : list.length === 0 ? (
            <div className="p-8 text-center text-sm text-zinc-500">
              Belum ada tryout. Klik &quot;Tambah Tryout&quot; untuk membuat.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
                <thead className="bg-zinc-50 dark:bg-zinc-900/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-zinc-500">
                      Judul
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
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-500">
                      Buka – Tutup
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-zinc-500">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {list.map((t) => (
                    <tr
                      key={t.id}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30"
                    >
                      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                        {t.title}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {t.short_title ?? "–"}
                      </td>
                      <td className="px-4 py-3">{t.duration_minutes} mnt</td>
                      <td className="px-4 py-3">{t.questions_count}</td>
                      <td className="px-4 py-3">
                        {LEVEL_LABEL[t.level] ?? t.level}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                          {STATUS_LABEL[t.status] ?? t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400">
                        {formatDate(t.opens_at)} – {formatDate(t.closes_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => openEdit(t)}
                          className="mr-2 text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
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
        </div>
      </main>

      {/* Modal Tambah / Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {modalOpen === "add" ? "Tambah Tryout" : "Edit Tryout"}
            </h2>
            {submitError && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                {submitError}
              </div>
            )}
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Judul *
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Judul singkat
                </label>
                <input
                  type="text"
                  value={form.short_title ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, short_title: e.target.value || undefined })
                  }
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Deskripsi
                </label>
                <textarea
                  rows={2}
                  value={form.description ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value || undefined })
                  }
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Durasi (menit) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={form.duration_minutes}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        duration_minutes: Number(e.target.value),
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Jumlah soal *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={form.questions_count}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        questions_count: Number(e.target.value),
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Level
                  </label>
                  <select
                    value={form.level}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        level: e.target.value as "easy" | "medium" | "hard",
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  >
                    <option value="easy">Mudah</option>
                    <option value="medium">Menengah</option>
                    <option value="hard">Sulit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
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
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  >
                    <option value="draft">Draft</option>
                    <option value="open">Dibuka</option>
                    <option value="closed">Ditutup</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Buka (tanggal & waktu)
                </label>
                <input
                  type="datetime-local"
                  required
                  value={form.opens_at}
                  onChange={(e) => setForm({ ...form, opens_at: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Tutup (tanggal & waktu)
                </label>
                <input
                  type="datetime-local"
                  required
                  value={form.closes_at}
                  onChange={(e) =>
                    setForm({ ...form, closes_at: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Max peserta (opsional)
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.max_participants ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      max_participants: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
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
