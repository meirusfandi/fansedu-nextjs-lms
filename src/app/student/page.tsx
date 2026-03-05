"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getStudentDashboard, getStudentTryouts, getAuthUserName, getStudentDisplayName, logout, clearAuthToken, getFriendlyApiErrorMessage } from "@/lib/api";
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
      .catch((e) => setError(getFriendlyApiErrorMessage(e)))
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-zinc-50 to-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-emerald-500" />
          <p className="text-sm font-medium text-zinc-500">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-zinc-50 to-white px-4">
        <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-amber-50/50 p-6 text-center shadow-sm">
          <p className="text-base font-medium text-amber-900">{error}</p>
          <p className="mt-3 text-sm text-amber-800/90">
            Jika masalah berlanjut, coba refresh halaman atau hubungi administrator. Pastikan server backend menyala dan alamat API di konfigurasi sudah benar.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
          >
            Coba lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 via-white to-zinc-50 text-zinc-900">
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 md:py-10">
        {/* Header — clean & elegant (light only) */}
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-zinc-500">
              Halo, {getStudentDisplayName(data) ?? getAuthUserName() ?? "Siswa"}
            </p>
            <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
              Dashboard OSN Informatika
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Pantau simulasi dan tingkatkan persiapanmu.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-700">
              Target OSN 2026
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
            >
              Keluar
            </button>
          </div>
        </header>

        {/* ═══ HIGHLIGHT: Tryout sedang dibuka — besar & menonjol ═══ */}
        <section id="daftar-tryout" className="mb-10">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            <h2 className="text-base font-bold text-zinc-900 sm:text-lg">
              Tryout sedang dibuka
            </h2>
          </div>
          <p className="mb-5 text-sm text-zinc-500">
            Event yang bisa dikerjakan sekarang. Pilih satu untuk mulai simulasi.
          </p>
          {openTryouts.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-zinc-200 bg-white/80 px-6 py-12 text-center">
              <p className="text-sm font-medium text-zinc-600">
                Tidak ada tryout yang dibuka saat ini.
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Cek lagi nanti atau lihat tryout yang sudah tutup di bawah.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {openTryouts.map((t) => {
                const alreadyDone = completedTryoutIds.has(t.id);
                return (
                  <Link
                    key={t.id}
                    href={`/tryout/${t.id}`}
                    className={`group relative overflow-hidden rounded-2xl border-2 p-6 shadow-lg transition-all duration-200 hover:shadow-xl sm:p-8 ${
                      alreadyDone
                        ? "border-zinc-200 bg-white"
                        : "border-emerald-400 bg-gradient-to-br from-emerald-50 to-white"
                    }`}
                  >
                    {!alreadyDone && (
                      <span className="absolute right-4 top-4 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        Bisa dikerjakan
                      </span>
                    )}
                    <h3 className="text-lg font-bold text-zinc-900 sm:text-xl">
                      {t.short_title ?? t.title}
                    </h3>
                    <p className="mt-2 text-sm text-zinc-600">
                      {formatDateRange(t.opens_at, t.closes_at)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-500">
                      <span>{t.duration_minutes} menit</span>
                      <span>·</span>
                      <span>{t.questions_count} soal</span>
                      <span>·</span>
                      <span>Tutup {formatDate(t.closes_at)}</span>
                    </div>
                    <div className="mt-6">
                      {alreadyDone ? (
                        <span className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm transition group-hover:bg-zinc-50">
                          Lihat leaderboard →
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition group-hover:bg-emerald-700">
                          Mulai tryout →
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Statistik — ringkas & elegan */}
        <section className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Ringkasan
            </h2>
            <Link
              href="#daftar-tryout"
              className="text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              Lihat semua
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-zinc-200/80 bg-white/90 p-4 shadow-sm backdrop-blur"
              >
                <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                  {s.label}
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-zinc-900">
                  {s.value}
                </p>
                <p className="mt-0.5 text-[11px] text-zinc-500">
                  {s.sub}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Ringkasan simulasi (grafik) — hanya jika ada riwayat */}
        <section className="mb-8">
          {hasCompletedTO ? (
            <div className="rounded-2xl border border-zinc-200/80 bg-white/90 p-5 shadow-sm sm:p-6">
              <h2 className="text-sm font-bold text-zinc-900">
                Ringkasan simulasi
              </h2>
              <div className="mt-4">
                <p className="mb-2 text-[11px] font-medium text-zinc-500">
                  Skor per simulasi
                </p>
                <div className="flex items-end justify-between gap-2 sm:gap-4">
                  {recentAttempts.slice(0, 5).map((a) => (
                    <div
                      key={a.id}
                      className="flex flex-1 flex-col items-center gap-1"
                    >
                      <div
                        className="flex w-full items-end justify-center rounded-t bg-zinc-200/80"
                        style={{ height: "100px" }}
                      >
                        <div
                          className="w-full max-w-[56px] rounded-t bg-emerald-500"
                          style={{
                            height: `${((a.score ?? 0) / (a.max_score ?? 100)) * 100}px`,
                            minHeight: (a.score ?? 0) > 0 ? "6px" : "0",
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-medium text-zinc-600">
                        {(a as { tryout_title?: string }).tryout_title?.slice(0, 10) ?? "Simulasi"}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        {a.score ?? "–"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 rounded-xl bg-zinc-50/80 p-3">
                <div className="text-center">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                    Total
                  </p>
                  <p className="mt-0.5 text-lg font-semibold text-zinc-900">
                    {totalTryouts}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                    Rata-rata skor
                  </p>
                  <p className="mt-0.5 text-lg font-semibold text-zinc-900">
                    {avgScore}
                    <span className="text-xs font-normal text-zinc-500">/100</span>
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                    Persentil
                  </p>
                  <p className="mt-0.5 text-lg font-semibold text-zinc-900">
                    {avgPercentile}%
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/60 px-4 py-6 text-center">
              <p className="text-sm text-zinc-600">
                Belum ada simulasi. Pilih tryout di atas untuk mulai.
              </p>
            </div>
          )}
        </section>

        {hasCompletedTO && (
          <section className="space-y-6">
            <div className="rounded-2xl border border-zinc-200/80 bg-white/90 shadow-sm">
              <h2 className="border-b border-zinc-100 bg-zinc-50/80 px-4 py-3 text-sm font-bold text-zinc-900">
                Riwayat simulasi
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50/80">
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
                  <tbody className="divide-y divide-zinc-100">
                    {recentAttempts.map((a) => (
                      <tr key={a.id}>
                        <td className="px-3 py-2 text-zinc-600">
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
                            <span className="ml-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                              {a.percentile}%
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span className="flex flex-wrap items-center justify-end gap-2">
                            <Link
                              href={`/student/attempts/${a.id}/review`}
                              className="text-[11px] font-medium text-zinc-600 underline-offset-2 hover:underline"
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
                              className="text-zinc-600 underline-offset-2 hover:underline"
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
                <div className="border-t border-zinc-100 bg-zinc-50/50 px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium text-zinc-800">
                      {(selectedAttempt as { tryout_title?: string }).tryout_title ?? "Simulasi"}
                    </p>
                    <button
                      type="button"
                      onClick={() => setSelectedAttemptId(null)}
                      className="text-[10px] text-zinc-500 hover:text-zinc-700"
                    >
                      Tutup
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-zinc-600">
                    Skor {selectedAttempt.score ?? "–"}/{selectedAttempt.max_score ?? 100}, persentil {selectedAttempt.percentile ?? "–"}%.
                  </p>
                  {selectedAttempt.time_seconds_spent != null && (
                    <p className="mt-1 text-[11px] text-zinc-600">
                      Waktu pengerjaan: {Math.round(selectedAttempt.time_seconds_spent / 60)} menit.
                    </p>
                  )}
                </div>
              )}
            </div>

            {false && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-zinc-900">
                Rekomendasi berdasarkan test yang telah dikerjakan
              </h2>
              <p className="mt-1 text-[11px] text-zinc-500">
                Kekuatan dan hal yang perlu ditingkatkan dari hasil tryout Anda.
              </p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-emerald-50 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                    Kekuatan
                  </p>
                  <ul className="mt-1.5 space-y-0.5 text-[11px] text-emerald-900">
                    {strengthAreas.length > 0
                      ? strengthAreas.map((a) => <li key={a}>• {a}</li>)
                      : <li className="text-zinc-500">Belum ada data. Selesaikan tryout untuk melihat analisis.</li>}
                  </ul>
                </div>
                <div className="rounded-lg bg-amber-50 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                    Perlu ditingkatkan
                  </p>
                  <ul className="mt-1.5 space-y-0.5 text-[11px] text-amber-900">
                    {improvementAreas.length > 0
                      ? improvementAreas.map((a) => <li key={a}>• {a}</li>)
                      : <li className="text-zinc-500">Belum ada data. Selesaikan tryout untuk melihat rekomendasi.</li>}
                  </ul>
                </div>
              </div>
              {recommendation && (
                <p className="mt-3 text-[11px] text-zinc-600">
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
