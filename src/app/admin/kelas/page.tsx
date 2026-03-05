"use client";

import { AdminSidebar } from "@/components/AdminSidebar";
import { Pagination, PAGE_SIZE } from "@/components/Pagination";
import { logout, clearAuthToken } from "@/lib/api";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

type BatchItem = {
  id: string;
  nama: string;
  periodeBuka: string;
  periodeTutup: string;
  keterangan: string;
};

export default function AdminKelasPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    nama: "",
    periodeBuka: "",
    periodeTutup: "",
    keterangan: "",
  });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const paginatedBatches = useMemo(
    () => batches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [batches, page]
  );

  const handleLogout = useCallback(() => {
    logout().catch(() => {});
    clearAuthToken();
    router.push("/login");
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const nama = form.nama.trim();
    if (!nama) {
      setSubmitError("Nama batch wajib diisi.");
      return;
    }
    setBatches((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        nama,
        periodeBuka: form.periodeBuka || "—",
        periodeTutup: form.periodeTutup || "—",
        keterangan: form.keterangan.trim() || "—",
      },
    ]);
    setForm({ nama: "", periodeBuka: "", periodeTutup: "", keterangan: "" });
    setModalOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-900">
      <AdminSidebar currentPath={pathname ?? ""} onLogout={handleLogout} />

      <main className="flex-1 px-4 py-5 sm:px-6 md:px-8 md:py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 md:mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Manage
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
              Management Kelas
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Kelas yang akan dibuka per batch. Kelola penawaran kelas per periode/angkatan (batch).
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setForm({ nama: "", periodeBuka: "", periodeTutup: "", keterangan: "" });
              setSubmitError(null);
              setModalOpen(true);
            }}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 hover:bg-zinc-800 "
          >
            + Tambah Batch
          </button>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm ">
          {batches.length === 0 ? (
            <div className="p-8 text-center text-sm text-zinc-500">
              <p>Belum ada batch.</p>
              <p className="mt-2 text-xs">
                Klik &quot;Tambah Batch&quot; untuk membuat periode penawaran kelas (mis. Batch Maret 2025, Batch Genap 2025).
              </p>
              <p className="mt-3 text-xs text-zinc-400">
                Integrasi API batch: nantinya daftar batch diambil dari backend.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-200 text-sm ">
                <thead className="bg-zinc-50 ">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-zinc-500">
                      Nama batch
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-500">
                      Periode buka
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-500">
                      Periode tutup
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-500">
                      Keterangan
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-zinc-500">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 ">
                  {paginatedBatches.map((b) => (
                    <tr
                      key={b.id}
                      className="hover:bg-zinc-50 "
                    >
                      <td className="px-4 py-3 font-medium text-zinc-900 ">
                        {b.nama}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        {b.periodeBuka}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        {b.periodeTutup}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        {b.keterangan}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          className="text-xs font-medium text-zinc-600 underline hover:text-zinc-900 "
                        >
                          Kelola kelas
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {batches.length > 0 && (
            <Pagination
              currentPage={page}
              totalItems={batches.length}
              onPageChange={setPage}
              label="batch"
            />
          )}
        </div>

        <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50/80 p-3 text-xs text-zinc-600 ">
          <strong>Beda dengan Master Data → Subject:</strong> Subject berisi kelas/bidang yang <em>saat ini dibuka</em>. Management Kelas berisi penjadwalan kelas <em>per batch</em> (periode/angkatan) yang akan dibuka.
        </div>
      </main>

      {modalOpen && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl ">
            <h2 className="text-lg font-semibold text-zinc-900 ">
              Tambah Batch
            </h2>
            {submitError && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 ">
                {submitError}
              </div>
            )}
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-600">
                  Nama batch *
                </label>
                <input
                  type="text"
                  required
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  placeholder="Mis. Batch Maret 2025"
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm "
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">
                  Periode buka
                </label>
                <input
                  type="date"
                  value={form.periodeBuka}
                  onChange={(e) => setForm({ ...form, periodeBuka: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm "
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">
                  Periode tutup
                </label>
                <input
                  type="date"
                  value={form.periodeTutup}
                  onChange={(e) => setForm({ ...form, periodeTutup: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm "
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">
                  Keterangan (opsional)
                </label>
                <input
                  type="text"
                  value={form.keterangan}
                  onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                  placeholder="Mis. Angkatan Genap 2025"
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm "
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 "
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 hover:bg-zinc-800 "
                >
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
