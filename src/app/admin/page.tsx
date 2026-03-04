"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { getAdminOverview, logout, clearAuthToken } from "@/lib/api";
import type { AdminOverviewResponse } from "@/lib/api-types";

const recentEnrollments = [
  {
    name: "Amirullah Pratama",
    course: "Kelas Algoritma Dasar OSN Informatika",
    date: "Hari ini · 09.15",
    status: "Terdaftar",
  },
  {
    name: "Siti Nurhaliza",
    course: "Pembinaan Struktur Data & Graph",
    date: "Hari ini · 08.42",
    status: "Berlangsung",
  },
  {
    name: "Budi Santoso",
    course: "Simulasi OSN Informatika - Kabupaten",
    date: "Kemarin · 16.03",
    status: "Selesai",
  },
  {
    name: "Intan Maharani",
    course: "Latihan Dynamic Programming",
    date: "Kemarin · 10.27",
    status: "Terdaftar",
  },
];

const topCourses = [
  {
    title: "Algoritma Dasar & Pemrograman Kompetitif",
    learners: 328,
    completion: 82,
  },
  {
    title: "Struktur Data & Graph untuk OSN",
    learners: 291,
    completion: 76,
  },
  {
    title: "Dynamic Programming Lanjutan",
    learners: 244,
    completion: 69,
  },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = () => {
    logout().catch(() => {});
    clearAuthToken();
    router.push("/login");
  };

  useEffect(() => {
    getAdminOverview()
      .then(setOverview)
      .catch((e) => setError((e as Error).message ?? "Gagal memuat data"))
      .finally(() => setLoading(false));
  }, []);

  const stats = overview
    ? [
        {
          label: "Total siswa terdaftar",
          value: String(overview.total_students),
          change: "Dari API",
        },
        {
          label: "Event aktif",
          value: String(overview.active_tryouts),
          change: "Dari API",
        },
        {
          label: "Rata-rata skor",
          value: String(overview.avg_score),
          change: "Dari API",
        },
        {
          label: "Sertifikat diterbitkan",
          value: String(overview.total_certificates),
          change: "Dari API",
        },
      ]
    : [
        { label: "Total siswa terdaftar", value: "–", change: "" },
        { label: "Event aktif", value: "–", change: "" },
        { label: "Rata-rata skor", value: "–", change: "" },
        { label: "Sertifikat diterbitkan", value: "–", change: "" },
      ];

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
              {item.change ? (
                <p className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  {item.change}
                </p>
              ) : null}
            </div>
          ))}
        </section>

        {/* Main grid */}
        <section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)]">
          {/* Recent enrollments */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-3 flex items-center justify-between">
              <div>
              <h2 className="text-sm font-semibold tracking-tight">
                Aktivitas terbaru peserta OSN Informatika
              </h2>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Pendaftaran dan progres terbaru peserta pembinaan OSN
                Informatika.
              </p>
              </div>
              <button className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900">
                View all
              </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-zinc-100 dark:border-zinc-800">
              <table className="min-w-full divide-y divide-zinc-100 text-xs dark:divide-zinc-800">
                <thead className="bg-zinc-50/80 dark:bg-zinc-950/60">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-zinc-500">
                      Peserta
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-zinc-500">
                      Event / kelas
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-zinc-500">
                      Waktu
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-zinc-500">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 bg-white dark:divide-zinc-900 dark:bg-zinc-950">
                  {recentEnrollments.map((item) => (
                    <tr key={`${item.name}-${item.course}`}>
                      <td className="px-3 py-2 align-top">
                        <p className="font-medium text-zinc-900 dark:text-zinc-50">
                          {item.name}
                        </p>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <p className="text-[11px] font-medium">
                          {item.course}
                        </p>
                      </td>
                      <td className="px-3 py-2 align-top text-[11px] text-zinc-500 dark:text-zinc-400">
                        {item.date}
                      </td>
                      <td className="px-3 py-2 align-top">
                        <span
                          className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right column: Top courses + Tasks */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold tracking-tight">
                    Sesi pembinaan terpopuler
                  </h2>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Kelas dan sesi OSN Informatika dengan keterlibatan tertinggi
                    minggu ini.
                  </p>
                </div>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                  This week
                </span>
              </div>

              <ul className="space-y-3 text-xs">
                {topCourses.map((course) => (
                  <li
                    key={course.title}
                    className="rounded-xl border border-zinc-100 px-3 py-2.5 dark:border-zinc-800"
                  >
                    <p className="text-[11px] font-medium text-zinc-900 dark:text-zinc-50">
                      {course.title}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                      <span>{course.learners} learners</span>
                      <span>{course.completion}% completion</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
                      <div
                        className="h-full rounded-full bg-zinc-900 dark:bg-zinc-50"
                        style={{ width: `${course.completion}%` }}
                      />
                    </div>
                  </li>
                ))}
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

