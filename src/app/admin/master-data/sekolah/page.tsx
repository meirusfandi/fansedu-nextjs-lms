"use client";

import { AdminSidebar } from "@/components/AdminSidebar";
import { Pagination, PAGE_SIZE } from "@/components/Pagination";
import {
  adminListHasilKelas,
  adminListSekolah,
  getRawJson,
  logout,
  clearAuthToken,
} from "@/lib/api";
import type { Sekolah } from "@/lib/api-types";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function MasterDataSekolahPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [list, setList] = useState<Sekolah[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [rawSekolah, setRawSekolah] = useState<unknown>(null);
  const [rawKelas, setRawKelas] = useState<unknown>(null);
  const [loadingKelas, setLoadingKelas] = useState(false);

  const paginatedList = useMemo(
    () => list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [list, page]
  );
  useEffect(() => {
    if (list.length > 0 && (page - 1) * PAGE_SIZE >= list.length) {
      setPage(1);
    }
  }, [list.length, page]);

  const handleLogout = useCallback(() => {
    logout().catch(() => {});
    clearAuthToken();
    router.push("/login");
  }, [router]);

  const loadList = useCallback(() => {
    setLoading(true);
    setError(null);
    setRawSekolah(null);
    adminListSekolah()
      .then((data) => {
        setList(data);
        if (data.length === 0) {
          getRawJson("/admin/master-data/sekolah").then(setRawSekolah);
        }
      })
      .catch((e) => {
        setError((e as Error).message ?? "Gagal memuat data sekolah");
        setList([]);
        getRawJson("/admin/master-data/sekolah").then(setRawSekolah);
      })
      .finally(() => setLoading(false));
  }, []);

  const loadFromHasilKelas = useCallback(() => {
    setLoadingKelas(true);
    setError(null);
    setRawKelas(null);
    getRawJson("/admin/kelas")
      .then((raw) => {
        setRawKelas(raw);
        return adminListHasilKelas();
      })
      .then((data) => {
        setList(data);
        setPage(1);
      })
      .catch((e) => {
        setError((e as Error).message ?? "Gagal memuat dari API hasil kelas");
      })
      .finally(() => setLoadingKelas(false));
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

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

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          {loading ? (
            <div className="p-8 text-center text-sm text-zinc-500">
              Memuat data sekolah...
            </div>
          ) : list.length === 0 ? (
            <div className="p-6">
              <p className="text-center text-sm text-zinc-500">
                Belum ada data sekolah.
              </p>
              <p className="mt-2 text-center text-xs text-zinc-500">
                Klik &quot;Tambah Data Sekolah&quot; untuk menambah, atau coba dari API hasil kelas jika backend mengembalikan data di sana.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Link
                  href="/admin/master-data/sekolah/tambah"
                  className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Tambah Data Sekolah
                </Link>
                <button
                  type="button"
                  onClick={loadFromHasilKelas}
                  disabled={loadingKelas}
                  className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  {loadingKelas ? "Memuat..." : "Coba dari API hasil kelas"}
                </button>
              </div>
              {(rawSekolah !== null || rawKelas !== null || (!loading && list.length === 0)) && (
                <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200">
                    Respons API (debug) — untuk cek kenapa data kosong
                  </p>
                  {rawSekolah === null && rawKelas === null && (
                    <p className="mb-3 text-xs text-zinc-600 dark:text-zinc-400">
                      GET /api/v1/admin/master-data/sekolah mengembalikan 404/405 atau error. Pastikan endpoint ini ada di backend dan mengembalikan array atau objek berisi data sekolah.
                    </p>
                  )}
                  {rawSekolah !== null && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        GET /api/v1/admin/master-data/sekolah
                      </p>
                      <pre className="mt-1 max-h-48 overflow-auto rounded-lg border border-zinc-200 bg-white p-3 text-left text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                        {JSON.stringify(rawSekolah, null, 2)}
                      </pre>
                    </div>
                  )}
                  {rawKelas !== null && (
                    <div>
                      <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        GET /api/v1/admin/kelas (hasil kelas)
                      </p>
                      <pre className="mt-1 max-h-48 overflow-auto rounded-lg border border-zinc-200 bg-white p-3 text-left text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                        {JSON.stringify(rawKelas, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
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
                  {paginatedList.map((s) => (
                    <tr
                      key={s.id}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30"
                    >
                      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                        {s.nama_sekolah}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {s.npsn ?? "–"}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {s.kabupaten_kota ?? "–"}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {s.telepon ?? "–"}
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
          {!loading && list.length > 0 && (
            <Pagination
              currentPage={page}
              totalItems={list.length}
              onPageChange={setPage}
              label="sekolah"
            />
          )}
        </div>
      </main>
    </div>
  );
}
