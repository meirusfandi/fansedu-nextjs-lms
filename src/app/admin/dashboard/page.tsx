"use client";

import Link from "next/link";
import { useAdminDashboard } from "@/hooks/useDashboardQueries";
import { getFriendlyApiErrorMessage } from "@/lib/api";
import { CardStats } from "@/components/ui/CardStats";

function formatRelativeDate(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    if (diffDays === 0)
      return `Hari ini · ${d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`;
    if (diffDays === 1)
      return `Kemarin · ${d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`;
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

const quickLinks = [
  { href: "/admin/master-data", label: "Master Data", desc: "Jenjang, bidang, sekolah" },
  { href: "/admin/users", label: "Management User", desc: "Siswa, pengajar, admin" },
  { href: "/admin/kelas", label: "Management Kelas", desc: "Kelas dan enrollment" },
  { href: "/admin/tryouts", label: "Event", desc: "Tryout & ujian" },
  { href: "/admin/payment", label: "Payment", desc: "Pembayaran & tagihan" },
  { href: "/admin/report", label: "Report", desc: "Laporan & statistik" },
] as const;

const iconUsers = (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
);
const iconCalendar = (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
  </svg>
);
const iconChart = (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
);
const iconAward = (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.796V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
  </svg>
);

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const styles =
    s === "published" || s === "active"
      ? "bg-emerald-100 text-emerald-800"
      : s === "draft"
        ? "bg-amber-100 text-amber-800"
        : s === "closed" || s === "ended"
          ? "bg-zinc-100 text-zinc-600"
          : "bg-zinc-100 text-zinc-700";
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${styles}`}>
      {status}
    </span>
  );
}

function StatSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="h-3 w-24 animate-pulse rounded bg-zinc-200" />
      <div className="mt-2 h-8 w-16 animate-pulse rounded bg-zinc-200" />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-4 rounded-lg bg-zinc-50 py-3 pl-3">
          <div className="h-4 w-28 animate-pulse rounded bg-zinc-200" />
          <div className="h-4 flex-1 animate-pulse rounded bg-zinc-200" />
          <div className="h-4 w-16 animate-pulse rounded bg-zinc-200" />
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data, isLoading, error } = useAdminDashboard();

  const stats = data
    ? [
        { label: "Total siswa terdaftar", value: String(data.totalStudents), icon: iconUsers },
        { label: "Event aktif", value: String(data.activeTryouts), icon: iconCalendar },
        {
          label: "Rata-rata skor",
          value: data.avgScore != null ? String(Math.round(Number(data.avgScore))) : "–",
          icon: iconChart,
        },
        { label: "Sertifikat diterbitkan", value: String(data.totalCertificates), icon: iconAward },
      ]
    : [
        { label: "Total siswa terdaftar", value: "–", icon: iconUsers },
        { label: "Event aktif", value: "–", icon: iconCalendar },
        { label: "Rata-rata skor", value: "–", icon: iconChart },
        { label: "Sertifikat diterbitkan", value: "–", icon: iconAward },
      ];

  const recentUsers = (data?.users ?? [])
    .slice(0, 8)
    .map((u) => ({ name: u.name, email: u.email, role: u.role, id: u.id }));
  const recentTryouts = (data?.tryouts ?? [])
    .slice()
    .sort((a, b) => new Date(b.closes_at).getTime() - new Date(a.closes_at).getTime())
    .slice(0, 6);

  if (error) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-amber-200 bg-amber-50/80 p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
          <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-base font-medium text-amber-900">{getFriendlyApiErrorMessage(error)}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-5 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-amber-700"
        >
          Coba lagi
        </button>
      </div>
    );
  }

  return (
    <>
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Overview</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">Dashboard</h1>
        <p className="mt-2 max-w-xl text-sm text-zinc-500">
          Ringkasan platform: user, kelas, event, payment, dan laporan.
        </p>
      </header>

      <section className="mb-8">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">Akses cepat</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-zinc-300 hover:shadow-md"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 transition group-hover:bg-zinc-900 group-hover:text-white">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <span className="block font-medium text-zinc-900 group-hover:text-zinc-700">{item.label}</span>
                <span className="block text-xs text-zinc-500">{item.desc}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">Statistik</h2>
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <StatSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((item) => (
              <CardStats
                key={item.label}
                title={item.label}
                value={item.value}
                icon={item.icon}
              />
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.8fr_1fr]">
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-100 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-zinc-900">User terdaftar</h2>
              <p className="mt-0.5 text-xs text-zinc-500">Siswa, pengajar, dan admin dari API.</p>
            </div>
            <Link
              href="/admin/users"
              className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              Lihat semua
            </Link>
          </div>
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-4">
                <TableSkeleton />
              </div>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/70">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Nama
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Role
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {recentUsers.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-10 text-center text-sm text-zinc-500">
                        Belum ada user dari API.
                      </td>
                    </tr>
                  ) : (
                    recentUsers.map((u) => (
                      <tr key={u.id} className="transition hover:bg-zinc-50/80">
                        <td className="px-4 py-3 font-medium text-zinc-900">{u.name}</td>
                        <td className="px-4 py-3 text-zinc-600">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700">
                            {u.role}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-100 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-zinc-900">Event / Tryout terbaru</h2>
                <p className="mt-0.5 text-xs text-zinc-500">Daftar event dari API.</p>
              </div>
              <Link
                href="/admin/tryouts"
                className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                Kelola
              </Link>
            </div>
            <div className="p-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 animate-pulse rounded-xl bg-zinc-100" />
                  ))}
                </div>
              ) : recentTryouts.length === 0 ? (
                <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 py-8 text-center text-sm text-zinc-500">
                  Belum ada event dari API.
                </p>
              ) : (
                <ul className="space-y-3">
                  {recentTryouts.map((t) => (
                    <li key={t.id}>
                      <Link
                        href={`/admin/tryouts/${t.id}/soal`}
                        className="block rounded-xl border border-zinc-100 p-3 transition hover:border-zinc-200 hover:bg-zinc-50/50"
                      >
                        <span className="block font-medium text-zinc-900">
                          {t.title || t.short_title || "Event"}
                        </span>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="text-xs text-zinc-500">{t.questions_count} soal</span>
                          <StatusBadge status={t.status} />
                        </div>
                        <p className="mt-1.5 text-xs text-zinc-400">
                          Tutup: {formatRelativeDate(t.closes_at)}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-zinc-900">Tugas admin</h2>
            <p className="mt-0.5 text-xs text-zinc-500">Rekomendasi untuk hari ini.</p>
            <ul className="mt-4 space-y-3">
              <li className="flex items-start gap-3 rounded-lg bg-zinc-50/80 p-3">
                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                <div>
                  <p className="text-sm font-medium text-zinc-900">Review draft course</p>
                  <p className="text-xs text-zinc-500">Periksa kualitas konten.</p>
                </div>
              </li>
              <li className="flex items-start gap-3 rounded-lg bg-zinc-50/80 p-3">
                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-sky-500" />
                <div>
                  <p className="text-sm font-medium text-zinc-900">Support tickets</p>
                  <p className="text-xs text-zinc-500">Tanggapi permintaan user.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
