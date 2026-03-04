"use client";

import { AdminSidebar } from "@/components/AdminSidebar";
import { adminListRoles, logout, clearAuthToken } from "@/lib/api";
import type { Role } from "@/lib/api-types";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function MasterDataRolePage() {
  const router = useRouter();
  const pathname = usePathname();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = useCallback(() => {
    logout().catch(() => {});
    clearAuthToken();
    router.push("/login");
  }, [router]);

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
    <div className="flex min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <AdminSidebar currentPath={pathname ?? ""} onLogout={handleLogout} />
      <main className="flex-1 px-4 py-5 sm:px-6 md:px-8 md:py-8">
        <div className="mb-6 md:mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            Master Data
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
            Role
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Daftar role user dari API (admin, pengajar, siswa, dll).
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          {loading ? (
            <div className="p-8 text-center text-sm text-zinc-500">
              Memuat daftar role...
            </div>
          ) : roles.length === 0 ? (
            <div className="p-8 text-center text-sm text-zinc-500">
              <p>Belum ada data role.</p>
              <p className="mt-2 text-xs">
                Pastikan backend <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">GET /api/v1/admin/roles</code> mengembalikan array role.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
                <thead className="bg-zinc-50 dark:bg-zinc-900/50">
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
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {roles.map((r) => (
                    <tr
                      key={r.id}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30"
                    >
                      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                        {r.name}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {r.slug ?? "–"}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {r.description ?? "–"}
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
