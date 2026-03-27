"use client";

import { Pagination, PAGE_SIZE } from "@/components/Pagination";
import { adminListRoles } from "@/lib/api";
import type { Role } from "@/lib/api-types";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function MasterDataRolePage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const paginatedRoles = useMemo(
    () => roles.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [roles, page]
  );
  useEffect(() => {
    if (roles.length > 0 && (page - 1) * PAGE_SIZE >= roles.length) {
      setPage(1);
    }
  }, [roles.length, page]);

  const loadRoles = useCallback(() => {
    setLoading(true);
    setError(null);
    adminListRoles()
      .then(setRoles)
      .catch((e) => {
        setError((e as Error).message ?? "Gagal memuat daftar role");
        setRoles([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  return (
    <div className="px-4 py-5 text-zinc-900 sm:px-6 md:px-8 md:py-8">
        <div className="mb-6 md:mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Master Data
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
            Role
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Daftar role user dari API (sesuai backend).
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-sm text-zinc-500">
              Memuat daftar role...
            </div>
          ) : roles.length === 0 ? (
            <div className="p-8 text-center text-sm text-zinc-500">
              <p>Belum ada data role.</p>
              <p className="mt-2 text-xs">
                Pastikan backend <code className="rounded bg-zinc-200 px-1">GET /api/v1/admin/roles</code> mengembalikan array role.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-200 text-sm">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-zinc-500">
                      Nama
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-500">
                      Slug
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-500">
                      Deskripsi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {paginatedRoles.map((r) => (
                    <tr
                      key={r.id}
                      className="hover:bg-zinc-50"
                    >
                      <td className="px-4 py-3 font-medium text-zinc-900">
                        {r.name}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        {r.slug ?? "–"}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        {r.description ?? "–"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!loading && roles.length > 0 && (
            <Pagination
              currentPage={page}
              totalItems={roles.length}
              onPageChange={setPage}
              label="role"
            />
          )}
        </div>
    </div>
  );
}
