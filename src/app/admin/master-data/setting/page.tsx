"use client";

import { AdminSidebar } from "@/components/AdminSidebar";
import { logout, clearAuthToken } from "@/lib/api";
import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";

export default function MasterDataSettingPage() {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = useCallback(() => {
    logout().catch(() => {});
    clearAuthToken();
    router.push("/login");
  }, [router]);

  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <AdminSidebar currentPath={pathname ?? ""} onLogout={handleLogout} />
      <main className="flex-1 px-4 py-5 sm:px-6 md:px-8 md:py-8">
        <div className="mb-6 md:mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            Master Data
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
            Setting
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Pengaturan umum platform dan konfigurasi.
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Halaman setting. Tambahkan form atau opsi konfigurasi di sini.
          </p>
        </div>
      </main>
    </div>
  );
}
