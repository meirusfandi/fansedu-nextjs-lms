"use client";

import { AdminSidebar } from "@/components/AdminSidebar";
import { logout, clearAuthToken } from "@/lib/api";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useState } from "react";

/** Mock / ganti dengan API list sekolah client */
type SekolahItem = {
  id: string;
  nama_sekolah: string;
  npsn: string;
  kabupaten_kota: string;
  telepon: string;
};

export default function MasterDataSekolahPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [list, setList] = useState<SekolahItem[]>([]);
  const [loading, setLoading] = useState(false);

  const handleLogout = useCallback(() => {
    logout().catch(() => {});
    clearAuthToken();
    router.push("/login");
  }, [router]);

  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <AdminSidebar currentPath={pathname ?? ""} onLogout={handleLogout} />
      <main className="flex-1 px-4 py-5 sm:px-6 md:px-8 md:py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 md:mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
              Master Data
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
              Data Sekolah
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Daftar data sekolah client.
            </p>
          </div>
          <Link
            href="/admin/master-data/sekolah/tambah"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            + Tambah Data Sekolah
          </Link>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          {loading ? (
            <div className="p-8 text-center text-sm text-zinc-500">
              Memuat data sekolah...
            </div>
          ) : list.length === 0 ? (
            <div className="p-8 text-center text-sm text-zinc-500">
              <p>Belum ada data sekolah.</p>
              <p className="mt-2 text-xs">
                Klik &quot;Tambah Data Sekolah&quot; untuk menambah sekolah client.
              </p>
              <Link
                href="/admin/master-data/sekolah/tambah"
                className="mt-4 inline-block rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Tambah Data Sekolah
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
                <thead className="bg-zinc-50 dark:bg-zinc-900/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-zinc-500">
                      Nama Sekolah
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-500">
                      NPSN
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-500">
                      Kabupaten / Kota
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-500">
                      Telepon
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-zinc-500">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {list.map((s) => (
                    <tr
                      key={s.id}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30"
                    >
                      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                        {s.nama_sekolah}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {s.npsn || "–"}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {s.kabupaten_kota || "–"}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {s.telepon || "–"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          className="text-xs font-medium text-zinc-600 underline hover:text-zinc-900 dark:hover:text-zinc-200"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
