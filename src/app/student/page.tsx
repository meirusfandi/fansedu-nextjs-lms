"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getStudentDashboard, getStudentTryouts, getAuthUserName, getStudentDisplayName, logout, clearAuthToken } from "@/lib/api";
import type { StudentDashboardResponse, TryoutSession } from "@/lib/api-types";

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatDateRange(opens: string, closes: string): string {
  try {
    const o = new Date(opens);
    const c = new Date(closes);
    return `${o.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })} – ${c.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}`;
  } catch {
    return `${opens} – ${closes}`;
  }
}

/** Saring tryout yang available: bukan draft. */
function filterAvailableTryouts(tryouts: TryoutSession[]): TryoutSession[] {
  return tryouts.filter((t) => t.status !== "draft");
}

/** Pisah berdasarkan status: masih buka (open) vs sudah selesai/tutup (closed). */
function partitionByStatus(tryouts: TryoutSession[]): {
  buka: TryoutSession[];
  tutup: TryoutSession[];
} {
  const buka: TryoutSession[] = [];
  const tutup: TryoutSession[] = [];
  for (const t of tryouts) {
    if (t.status === "open") {
      buka.push(t);
    } else {
      tutup.push(t);
    }
  }
  tutup.sort((a, b) => new Date(b.closes_at).getTime() - new Date(a.closes_at).getTime());
  return { buka, tutup };
}

export default function StudentDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<StudentDashboardResponse | null>(null);
  const [allTryouts, setAllTryouts] = useState<TryoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);

  const handleLogout = () => {
    logout().catch(() => {});
    clearAuthToken();
    router.push("/login");
  };

  useEffect(() => {
    Promise.all([getStudentDashboard(), getStudentTryouts()])
      .then(([dashboard, tryouts]) => {
        setData(dashboard);
        const openFromDashboard = dashboard?.open_tryouts ?? [];
        const ids = new Set(tryouts.map((t) => t.id));
        const merged = [...tryouts];
        for (const t of openFromDashboard) {
          if (!ids.has(t.id)) {
            merged.push(t);
            ids.add(t.id);
          }
        }
        const available = filterAvailableTryouts(merged);
        setAllTryouts(available);
      })
      .catch((e) => setError((e as Error).message ?? "Gagal memuat dashboard"))
      .finally(() => setLoading(false));
  }, []);

  const { buka: openTryouts, tutup: closedTryouts } = partitionByStatus(allTryouts);
  const recentAttempts = data?.recent_attempts ?? [];
  const summary = data?.summary;
  const hasCompletedTO = recentAttempts.length > 0;
  /** Tryout yang sudah pernah diselesaikan (submitted) — tombol Mulai disembunyikan */
  const completedTryoutIds = useMemo(
    () => new Set(
      recentAttempts
        .filter((a) => a.status === "submitted")
        .map((a) => a.tryout_session_id)
    ),
    [recentAttempts]
  );
  const totalTryouts = summary?.total_attempts ?? 0;
  const avgScore = summary?.avg_score ?? 0;
  const avgPercentile = summary?.avg_percentile ?? 0;
  const strengthAreas = data?.strength_areas ?? [];
  const improvementAreas = data?.improvement_areas ?? [];
  const recommendation = data?.recommendation ?? "";
  const selectedAttempt = recentAttempts.find((a) => a.id === selectedAttemptId);

  const stats = [
    {
      label: "Total simulasi",
      value: totalTryouts,
      sub: "kali mengerjakan",
    },
    {
      label: "Rata-rata skor",
      value: avgScore != null ? `${Math.round(Number(avgScore))}` : "–",
      sub: "dari 100",
    },
    {
      label: "Persentil rata-rata",
      value: avgPercentile != null ? `${Math.round(Number(avgPercentile))}%` : "–",
      sub: "dibanding peserta",
    },
    {
      label: "Tryout dibuka",
      value: openTryouts.length,
      sub: "bisa dikerjakan sekarang",
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-sm text-zinc-500">Memuat dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-black">
        <div className="rounded-2xl border border-red-200 bg-white p-6 text-center dark:border-red-900/50 dark:bg-zinc-950">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <p className="mt-2 text-xs text-zinc-500">
            Pastikan backend API berjalan dan NEXT_PUBLIC_API_URL benar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 md:py-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Halo, Selamat Datang, {getStudentDisplayName(data) ?? getAuthUserName() ?? "Siswa"}
            </p>
            <h1 className="mt-1 text-lg font-semibold tracking-tight sm:text-xl">
              Dashboard OSN Informatika
            </h1>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              Pantau simulasi dan rekomendasi belajar.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900">
              Target OSN 2026
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Keluar
            </button>
          </div>
        </header>

        {/* Statistik — selalu tampil */}
        <section className="mb-6">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Statistik
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
              >
                <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {s.label}
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
                  {s.value}
                </p>
                <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                  {s.sub}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-6">
          {hasCompletedTO ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-5">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Ringkasan simulasi
              </h2>
              <div className="mt-4">
                <p className="mb-2 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  Skor per simulasi
                </p>
                <div className="flex items-end justify-between gap-2 sm:gap-4">
                  {recentAttempts.slice(0, 5).map((a) => (
                    <div
                      key={a.id}
                      className="flex flex-1 flex-col items-center gap-1"
                    >
                      <div
                        className="flex w-full items-end justify-center rounded-t bg-zinc-200 dark:bg-zinc-700"
                        style={{ height: "100px" }}
                      >
                        <div
                          className="w-full max-w-[56px] rounded-t bg-emerald-500 dark:bg-emerald-600"
                          style={{
                            height: `${((a.score ?? 0) / (a.max_score ?? 100)) * 100}px`,
                            minHeight: (a.score ?? 0) > 0 ? "6px" : "0",
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-medium text-zinc-600 dark:text-zinc-300">
                        {(a as { tryout_title?: string }).tryout_title?.slice(0, 10) ?? "Simulasi"}
                      </span>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                        {a.score ?? "–"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-900/50">
                <div className="text-center">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Total
                  </p>
                  <p className="mt-0.5 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    {totalTryouts}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Rata-rata skor
                  </p>
                  <p className="mt-0.5 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    {avgScore}
                    <span className="text-xs font-normal text-zinc-500">/100</span>
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Persentil
                  </p>
                  <p className="mt-0.5 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    {avgPercentile}%
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-4 py-4 text-center dark:border-zinc-700 dark:bg-zinc-950">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Belum ada simulasi. Pilih jadwal di bawah untuk mulai.
              </p>
            </div>
          )}
        </section>

        {/* Semua tryout available (bukan draft), pisah: sudah dibuka vs sudah tutup */}

        {/* Tryout dibuka — status open, bisa dikerjakan sekarang */}
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Tryout dibuka
          </h2>
          <p className="mb-3 text-[11px] text-zinc-500 dark:text-zinc-400">
            Event dengan status dibuka. Bisa dikerjakan sekarang.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {openTryouts.length === 0 ? (
              <p className="col-span-full rounded-xl border border-dashed border-zinc-300 bg-white px-4 py-4 text-center text-xs text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
                Tidak ada tryout yang dibuka saat ini.
              </p>
            ) : (
              openTryouts.map((t) => {
                const alreadyDone = completedTryoutIds.has(t.id);
                return alreadyDone ? (
                  <Link
                    key={t.id}
                    href={`/tryout/${t.id}`}
                    className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 transition hover:border-zinc-300 hover:bg-zinc-100/50 dark:border-zinc-700 dark:bg-zinc-900/50 dark:hover:border-zinc-600 dark:hover:bg-zinc-900/70"
                  >
                    <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      {t.short_title ?? t.title}
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                      {formatDateRange(t.opens_at, t.closes_at)}
                    </p>
                    <p className="mt-0.5 text-[10px] text-zinc-500">
                      {t.duration_minutes} menit · {t.questions_count} soal · Tutup: {formatDate(t.closes_at)}
                    </p>
                    <span className="mt-3 inline-flex items-center rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-[11px] font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700">
                      Lihat leaderboard →
                    </span>
                  </Link>
                ) : (
                  <Link
                    key={t.id}
                    href={`/tryout/${t.id}`}
                    className="rounded-xl border border-emerald-200 bg-white p-4 shadow-sm transition hover:border-emerald-300 dark:border-emerald-900/50 dark:bg-zinc-950 dark:hover:border-emerald-800"
                  >
                    <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                      {t.short_title ?? t.title}
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-400">
                      {formatDateRange(t.opens_at, t.closes_at)}
                    </p>
                    <p className="mt-0.5 text-[10px] text-zinc-500">
                      {t.duration_minutes} menit · {t.questions_count} soal · Tutup: {formatDate(t.closes_at)}
                    </p>
                    <span className="mt-3 inline-block text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                      Mulai tryout →
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </section>

        {/* Tryout tutup — status closed */}
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Tryout sudah tutup
          </h2>
          <p className="mb-3 text-[11px] text-zinc-500 dark:text-zinc-400">
            Event yang sudah ditutup. Periode pengerjaan berakhir.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {closedTryouts.length === 0 ? (
              <p className="col-span-full rounded-xl border border-dashed border-zinc-300 bg-white px-4 py-4 text-center text-xs text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
                Tidak ada tryout yang sudah tutup.
              </p>
            ) : (
              closedTryouts.map((t) => (
                <div
                  key={t.id}
                  className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/30"
                >
                  <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    {t.short_title ?? t.title}
                  </p>
                  <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                    {formatDateRange(t.opens_at, t.closes_at)}
                  </p>
                  <p className="mt-0.5 text-[10px] text-zinc-500">
                    {t.duration_minutes} menit · {t.questions_count} soal
                  </p>
                  <span className="mt-3 inline-block text-[11px] text-zinc-500 dark:text-zinc-400">
                    Sudah tutup
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        {hasCompletedTO && (
          <section className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="border-b border-zinc-100 px-4 py-3 text-sm font-semibold dark:border-zinc-800 dark:bg-zinc-950/50">
                Riwayat simulasi
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/50">
                      <th className="px-3 py-2 text-left font-medium text-zinc-500">
                        Tanggal
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-zinc-500">
                        Paket
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-zinc-500">
                        Skor
                      </th>
                      <th className="px-3 py-2 text-right font-medium text-zinc-500">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {recentAttempts.map((a) => (
                      <tr key={a.id}>
                        <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">
                          {a.submitted_at
                            ? formatDate(a.submitted_at)
                            : "–"}
                        </td>
                        <td className="px-3 py-2 font-medium">
                          {(a as { tryout_title?: string }).tryout_title ?? "Simulasi"}
                        </td>
                        <td className="px-3 py-2">
                          <span className="font-semibold">{a.score ?? "–"}</span>
                          <span className="text-zinc-500">/{a.max_score ?? 100}</span>
                          {a.percentile != null && (
                            <span className="ml-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                              {a.percentile}%
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span className="flex flex-wrap items-center justify-end gap-2">
                            <Link
                              href={`/student/attempts/${a.id}/review`}
                              className="text-[11px] font-medium text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
                            >
                              Lihat soal & jawaban
                            </Link>
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedAttemptId(
                                  selectedAttemptId === a.id ? null : a.id
                                )
                              }
                              className="text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
                            >
                              {selectedAttemptId === a.id
                                ? "Sembunyikan"
                                : "Detail"}
                            </button>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {selectedAttempt && (
                <div className="border-t border-zinc-100 bg-zinc-50/50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/30">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium text-zinc-800 dark:text-zinc-100">
                      {(selectedAttempt as { tryout_title?: string }).tryout_title ?? "Simulasi"}
                    </p>
                    <button
                      type="button"
                      onClick={() => setSelectedAttemptId(null)}
                      className="text-[10px] text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                    >
                      Tutup
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-400">
                    Skor {selectedAttempt.score ?? "–"}/{selectedAttempt.max_score ?? 100}, persentil {selectedAttempt.percentile ?? "–"}%.
                  </p>
                  {selectedAttempt.time_seconds_spent != null && (
                    <p className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-400">
                      Waktu pengerjaan: {Math.round(selectedAttempt.time_seconds_spent / 60)} menit.
                    </p>
                  )}
                </div>
              )}
            </div>

            {false && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Rekomendasi berdasarkan test yang telah dikerjakan
              </h2>
              <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                Kekuatan dan hal yang perlu ditingkatkan dari hasil tryout Anda.
              </p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950/30">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                    Kekuatan
                  </p>
                  <ul className="mt-1.5 space-y-0.5 text-[11px] text-emerald-900 dark:text-emerald-100">
                    {strengthAreas.length > 0
                      ? strengthAreas.map((a) => <li key={a}>• {a}</li>)
                      : <li className="text-zinc-500">Belum ada data. Selesaikan tryout untuk melihat analisis.</li>}
                  </ul>
                </div>
                <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-950/30">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                    Perlu ditingkatkan
                  </p>
                  <ul className="mt-1.5 space-y-0.5 text-[11px] text-amber-900 dark:text-amber-100">
                    {improvementAreas.length > 0
                      ? improvementAreas.map((a) => <li key={a}>• {a}</li>)
                      : <li className="text-zinc-500">Belum ada data. Selesaikan tryout untuk melihat rekomendasi.</li>}
                  </ul>
                </div>
              </div>
              {recommendation && (
                <p className="mt-3 text-[11px] text-zinc-600 dark:text-zinc-400">
                  {recommendation}
                </p>
              )}
            </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
