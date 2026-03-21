"use client";

import { Pagination, PAGE_SIZE } from "@/components/Pagination";
import { adminListLevels } from "@/lib/api";
import type { Level } from "@/lib/api-types";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function MasterDataJenjangPage() {
  const [list, setList] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const paginatedList = useMemo(
    () => list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [list, page]
  );
  useEffect(() => {
    if (list.length > 0 && (page - 1) * PAGE_SIZE >= list.length) {
      setPage(1);
    }
  }, [list.length, page]);

  const loadLevels = useCallback(() => {
    setLoading(true);
    setError(null);
    adminListLevels()
      .then(setList)
      .catch((e) => {
        setError((e as Error).message ?? "Gagal memuat data jenjang");
        setList([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadLevels();
  }, [loadLevels]);

  return (
    <div className="px-4 py-5 sm:px-6 md:px-8 md:py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 md:mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Master Data
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
              Jenjang Pendidikan
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Daftar jenjang pendidikan (SD, SMP, SMA, dll).
            </p>
          </div>
          <Link
            href="/admin/master-data/jenjang/tambah"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 hover:bg-zinc-800"
          >
            + Tambah Jenjang Pendidikan
          </Link>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-sm text-zinc-500">
              Memuat data jenjang...
            </div>
          ) : list.length === 0 ? (
            <div className="p-8 text-center text-sm text-zinc-500">
              <p>Belum ada data jenjang pendidikan.</p>
              <p className="mt-2 text-xs">
                Klik &quot;Tambah Jenjang Pendidikan&quot; untuk menambah (mis. SD, SMP, SMA).
              </p>
              <Link
                href="/admin/master-data/jenjang/tambah"
                className="mt-4 inline-block rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Tambah Jenjang Pendidikan
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-200 text-sm">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-zinc-500">
                      Urutan
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-500">
                      Nama
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-500">
                      Slug
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-500">
                      Deskripsi
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-zinc-500">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {paginatedList.map((j) => (
                    <tr
                      key={j.id}
                      className="hover:bg-zinc-50"
                    >
                      <td className="px-4 py-3 text-zinc-600">
                        {j.sort_order ?? "–"}
                      </td>
                      <td className="px-4 py-3 font-medium text-zinc-900">
                        {j.name}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        {j.slug ?? "–"}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        {j.description ?? "–"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/master-data/jenjang/${j.id}/edit`}
                          className="text-xs font-medium text-zinc-600 underline hover:text-zinc-900"
                        >
                          Edit
                        </Link>
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
              label="jenjang"
            />
          )}
        </div>
    </div>
  );
}
