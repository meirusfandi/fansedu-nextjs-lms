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
    if (diffDays === 0) return `Hari ini · ${d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`;
    if (diffDays === 1) return `Kemarin · ${d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`;
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

export default function AdminDashboardPage() {
  const { data, isLoading, error } = useAdminDashboard();

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

  const recentUsers = (data?.users ?? []).slice(0, 8).map((u) => ({ name: u.name, email: u.email, role: u.role, id: u.id }));
  const recentTryouts = (data?.tryouts ?? [])
    .slice()
    .sort((a, b) => new Date(b.closes_at).getTime() - new Date(a.closes_at).getTime())
    .slice(0, 6);

  if (error) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6 text-center">
        <p className="text-base font-medium text-amber-900">{getFriendlyApiErrorMessage(error)}</p>
        <button type="button" onClick={() => window.location.reload()} className="mt-4 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700">
          Coba lagi
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 md:mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Overview</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">Ringkasan platform: user, kelas, event, payment, dan report.</p>
      </div>

      <section className="mb-6 flex flex-wrap gap-2">
        <Link href="/admin/master-data" className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50">Master Data</Link>
        <Link href="/admin/users" className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50">Management User</Link>
        <Link href="/admin/kelas" className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50">Management Kelas</Link>
        <Link href="/admin/tryouts" className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50">Event</Link>
        <Link href="/admin/payment" className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50">Payment</Link>
        <Link href="/admin/report" className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50">Report</Link>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <CardStats key={item.label} title={item.label} value={isLoading ? "..." : item.value} />
        ))}
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)]">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold tracking-tight">User terdaftar</h2>
              <p className="mt-1 text-xs text-zinc-500">Daftar user dari API (siswa, pengajar, admin).</p>
            </div>
            <Link href="/admin/users" className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100">Lihat semua</Link>
          </div>
          <div className="overflow-hidden rounded-xl border border-zinc-100">
            <table className="min-w-full divide-y divide-zinc-100 text-xs">
              <thead className="bg-zinc-50/80">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-zinc-500">Nama</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-500">Email</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-500">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {recentUsers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-4 text-center text-zinc-500">Belum ada user dari API.</td>
                  </tr>
                ) : (
                  recentUsers.map((u) => (
                    <tr key={u.id}>
                      <td className="px-3 py-2 font-medium text-zinc-900">{u.name}</td>
                      <td className="px-3 py-2 text-zinc-600">{u.email}</td>
                      <td className="px-3 py-2">
                        <span className="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-700">{u.role}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold tracking-tight">Event / Tryout terbaru</h2>
                <p className="mt-1 text-xs text-zinc-500">Daftar event dari API.</p>
              </div>
              <Link href="/admin/tryouts" className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100">Kelola</Link>
            </div>
            <ul className="space-y-3 text-xs">
              {recentTryouts.length === 0 ? (
                <li className="rounded-xl border border-zinc-100 px-3 py-3 text-center text-zinc-500">Belum ada event dari API.</li>
              ) : (
                recentTryouts.map((t) => (
                  <li key={t.id} className="rounded-xl border border-zinc-100 px-3 py-2.5">
                    <Link href={`/admin/tryouts/${t.id}/soal`} className="text-[11px] font-medium text-zinc-900 hover:underline">
                      {t.title || t.short_title || "Event"}
                    </Link>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500">
                      <span>{t.questions_count} soal</span>
                      <span className="capitalize">{t.status}</span>
                    </div>
                    <p className="mt-1 text-[10px] text-zinc-400">Tutup: {formatRelativeDate(t.closes_at)}</p>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-tight">Admin tasks</h2>
              <span className="text-[11px] text-zinc-500">Today</span>
            </div>
            <ul className="space-y-2 text-xs">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <div>
                  <p className="font-medium">Review course drafts</p>
                  <p className="text-[11px] text-zinc-500">Check content quality.</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500" />
                <div>
                  <p className="font-medium">Support tickets</p>
                  <p className="text-[11px] text-zinc-500">Respond to requests.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
