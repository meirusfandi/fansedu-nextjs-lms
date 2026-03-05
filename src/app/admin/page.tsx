"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { getAdminDashboardData, logout, clearAuthToken } from "@/lib/api";
import type { AdminDashboardData } from "@/lib/api";

function formatRelativeDate(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    if (diffDays === 0) return `Hari ini · ${d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`;
    if (diffDays === 1) return `Kemarin · ${d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`;
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = () => {
    logout().catch(() => {});
    clearAuthToken();
    router.push("/login");
  };

  useEffect(() => {
    getAdminDashboardData()
      .then(setData)
      .catch((e) => setError((e as Error).message ?? "Gagal memuat data"))
      .finally(() => setLoading(false));
  }, []);

  const stats = data
    ? [
        { label: "Total siswa terdaftar", value: String(data.totalStudents) },
        { label: "Event aktif", value: String(data.activeTryouts) },
        { label: "Rata-rata skor", value: data.avgScore != null ? String(Math.round(Number(data.avgScore))) : "–" },
        { label: "Sertifikat diterbitkan", value: String(data.totalCertificates) },
      ]
    : [
        { label: "Total siswa terdaftar", value: "–" },
        { label: "Event aktif", value: "–" },
        { label: "Rata-rata skor", value: "–" },
        { label: "Sertifikat diterbitkan", value: "–" },
      ];

  const recentUsers = (data?.users ?? []).slice(0, 8).map((u) => ({
    name: u.name,
    email: u.email,
    role: u.role,
    id: u.id,
  }));

  const recentTryouts = (data?.tryouts ?? [])
    .slice()
    .sort((a, b) => new Date(b.closes_at).getTime() - new Date(a.closes_at).getTime())
    .slice(0, 6);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-black">
        <div className="rounded-2xl border border-red-200 bg-white p-6 text-center dark:border-red-900/50 dark:bg-zinc-950">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <p className="mt-2 text-xs text-zinc-500">
            Pastikan backend API berjalan dan token admin valid.
          </p>
        </div>
      </div>
    );
  }

  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <AdminSidebar currentPath={pathname ?? ""} onLogout={handleLogout} />

      {/* Main content */}
      <main className="flex-1 px-4 py-5 sm:px-6 md:px-8 md:py-8">
        {/* Top bar (for mobile brand + user) */}
        <div className="mb-6 flex items-center justify-between md:mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
              Overview
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Ringkasan kebutuhan platform: user, kelas, event, payment, dan report.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Keluar
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-zinc-800 to-zinc-600 text-xs font-semibold text-zinc-50 dark:from-zinc-100 dark:to-zinc-300 dark:text-zinc-900">
              A
            </div>
          </div>
        </div>

        {/* Quick links */}
        <section className="mb-6 flex flex-wrap gap-2">
          <Link
            href="/admin/master-data"
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Master Data
          </Link>
          <Link
            href="/admin/users"
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Management User
          </Link>
          <Link
            href="/admin/kelas"
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Management Kelas
          </Link>
          <Link
            href="/admin/tryouts"
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Event
          </Link>
          <Link
            href="/admin/payment"
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Payment
          </Link>
          <Link
            href="/admin/report"
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Report
          </Link>
        </section>

        {/* Stats grid */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-4 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {item.label}
              </p>
              <p className="mt-2 text-xl font-semibold tracking-tight">
                {loading ? "..." : item.value}
              </p>
            </div>
          ))}
        </section>

        {/* Main grid */}
        <section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)]">
          {/* User terdaftar (dari API) */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold tracking-tight">
                  User terdaftar
                </h2>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Daftar user dari API (siswa, pengajar, admin).
                </p>
              </div>
              <Link
                href="/admin/users"
                className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                Lihat semua
              </Link>
            </div>

            <div className="overflow-hidden rounded-xl border border-zinc-100 dark:border-zinc-800">
              <table className="min-w-full divide-y divide-zinc-100 text-xs dark:divide-zinc-800">
                <thead className="bg-zinc-50/80 dark:bg-zinc-950/60">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-zinc-500">
                      Nama
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-zinc-500">
                      Email
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-zinc-500">
                      Role
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 bg-white dark:divide-zinc-900 dark:bg-zinc-950">
                  {recentUsers.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-3 py-4 text-center text-zinc-500 dark:text-zinc-400">
                        Belum ada user dari API.
                      </td>
                    </tr>
                  ) : (
                    recentUsers.map((u) => (
                      <tr key={u.id}>
                        <td className="px-3 py-2 font-medium text-zinc-900 dark:text-zinc-50">
                          {u.name}
                        </td>
                        <td className="px-3 py-2 text-zinc-600 dark:text-zinc-300">
                          {u.email}
                        </td>
                        <td className="px-3 py-2">
                          <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                            {u.role}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right column: Event terbaru + Tasks */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold tracking-tight">
                    Event / Tryout terbaru
                  </h2>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Daftar event dari API, diurutkan berdasarkan waktu tutup.
                  </p>
                </div>
                <Link
                  href="/admin/tryouts"
                  className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  Kelola
                </Link>
              </div>

              <ul className="space-y-3 text-xs">
                {recentTryouts.length === 0 ? (
                  <li className="rounded-xl border border-zinc-100 px-3 py-3 text-center text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                    Belum ada event dari API.
                  </li>
                ) : (
                  recentTryouts.map((t) => (
                    <li
                      key={t.id}
                      className="rounded-xl border border-zinc-100 px-3 py-2.5 dark:border-zinc-800"
                    >
                      <Link
                        href={`/admin/tryouts/${t.id}/soal`}
                        className="text-[11px] font-medium text-zinc-900 hover:underline dark:text-zinc-50"
                      >
                        {t.title || t.short_title || "Event"}
                      </Link>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                        <span>{t.questions_count} soal</span>
                        <span className="capitalize">{t.status}</span>
                      </div>
                      <p className="mt-1 text-[10px] text-zinc-400 dark:text-zinc-500">
                        Tutup: {formatRelativeDate(t.closes_at)}
                      </p>
                    </li>
                  ))
                )}
              </ul>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold tracking-tight">
                  Admin tasks
                </h2>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Today
                </span>
              </div>

              <ul className="space-y-2 text-xs">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <div>
                    <p className="font-medium">Review 5 new course drafts</p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Check content quality and publish schedule.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500" />
                  <div>
                    <p className="font-medium">Respond to support tickets</p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      7 tickets awaiting your response.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500" />
                  <div>
                    <p className="font-medium">Update certification settings</p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Configure new passing criteria for advanced tracks.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

