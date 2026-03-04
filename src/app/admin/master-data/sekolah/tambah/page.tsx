"use client";

import { AdminSidebar } from "@/components/AdminSidebar";
import { logout, clearAuthToken } from "@/lib/api";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useState } from "react";

const defaultInfo = {
  nama_sekolah: "",
  npsn: "",
  alamat: "",
  kelurahan: "",
  kecamatan: "",
  kabupaten_kota: "",
  provinsi: "",
  kode_pos: "",
  telepon: "",
  email: "",
  website: "",
};

export default function TambahDataSekolahPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [info, setInfo] = useState(defaultInfo);
  const [saved, setSaved] = useState(false);

  const handleLogout = useCallback(() => {
    logout().catch(() => {});
    clearAuthToken();
    router.push("/login");
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: panggil API simpan info sekolah
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <AdminSidebar currentPath={pathname ?? ""} onLogout={handleLogout} />
      <main className="flex-1 px-4 py-5 sm:px-6 md:px-8 md:py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 md:mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
              Master Data · Sekolah
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
              Tambah Data Sekolah
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Isi informasi sekolah client.
            </p>
          </div>
          <Link
            href="/admin/master-data/sekolah"
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            ← Kembali ke list
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Identitas
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Nama Sekolah *
                </label>
                <input
                  type="text"
                  required
                  value={info.nama_sekolah}
                  onChange={(e) => setInfo({ ...info, nama_sekolah: e.target.value })}
                  placeholder="Nama lengkap sekolah"
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  NPSN
                </label>
                <input
                  type="text"
                  value={info.npsn}
                  onChange={(e) => setInfo({ ...info, npsn: e.target.value })}
                  placeholder="Nomor Pokok Sekolah Nasional"
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Alamat
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Alamat
                </label>
                <textarea
                  rows={2}
                  value={info.alamat}
                  onChange={(e) => setInfo({ ...info, alamat: e.target.value })}
                  placeholder="Jalan, nomor, RT/RW"
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Kelurahan
                  </label>
                  <input
                    type="text"
                    value={info.kelurahan}
                    onChange={(e) => setInfo({ ...info, kelurahan: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Kecamatan
                  </label>
                  <input
                    type="text"
                    value={info.kecamatan}
                    onChange={(e) => setInfo({ ...info, kecamatan: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Kabupaten / Kota
                  </label>
                  <input
                    type="text"
                    value={info.kabupaten_kota}
                    onChange={(e) => setInfo({ ...info, kabupaten_kota: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Provinsi
                  </label>
                  <input
                    type="text"
                    value={info.provinsi}
                    onChange={(e) => setInfo({ ...info, provinsi: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                </div>
              </div>
              <div className="max-w-[8rem]">
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Kode Pos
                </label>
                <input
                  type="text"
                  value={info.kode_pos}
                  onChange={(e) => setInfo({ ...info, kode_pos: e.target.value })}
                  placeholder="12345"
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Kontak
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Telepon
                </label>
                <input
                  type="text"
                  value={info.telepon}
                  onChange={(e) => setInfo({ ...info, telepon: e.target.value })}
                  placeholder="021-xxxxx atau 08xx"
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Email
                </label>
                <input
                  type="email"
                  value={info.email}
                  onChange={(e) => setInfo({ ...info, email: e.target.value })}
                  placeholder="sekolah@example.com"
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Website
                </label>
                <input
                  type="url"
                  value={info.website}
                  onChange={(e) => setInfo({ ...info, website: e.target.value })}
                  placeholder="https://..."
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Simpan Data Sekolah
            </button>
            <Link
              href="/admin/master-data/sekolah"
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Batal
            </Link>
            {saved && (
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                Disimpan.
              </span>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}
