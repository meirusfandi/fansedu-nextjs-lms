"use client";

import { AdminSidebar } from "@/components/AdminSidebar";
import { logout, clearAuthToken } from "@/lib/api";
import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";

export default function AdminPaymentPage() {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = useCallback(() => {
    logout().catch(() => {});
    clearAuthToken();
    router.push("/login");
  }, [router]);

  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-900">
      <AdminSidebar currentPath={pathname ?? ""} onLogout={handleLogout} />

      <main className="flex-1 px-4 py-5 sm:px-6 md:px-8 md:py-8">
        <div className="mb-6 md:mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Manage
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
            Payment
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Kelola pembayaran user yang melakukan pembelian kelas atau layanan.
          </p>
        </div>

        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center ">
          <p className="text-sm font-medium text-zinc-700">
            Menu payment akan hadir di sini.
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            Anda dapat melihat riwayat pembayaran, konfirmasi pembayaran, dan laporan pembelian kelas.
          </p>
        </div>
      </main>
    </div>
  );
}
