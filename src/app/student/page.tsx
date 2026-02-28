"use client";

import Link from "next/link";
import { useState } from "react";

const availableTryouts = [
  {
    id: "to-1",
    title: "Simulasi OSN Informatika - Tingkat Kabupaten",
    description: "Latihan komprehensif materi dasar OSN Informatika.",
    duration: "90 menit",
    questions: 20,
    level: "Menengah",
  },
  {
    id: "to-2",
    title: "Simulasi OSN Informatika - Tingkat Provinsi",
    description:
      "Soal-soal algoritma, struktur data, dan logika pemrograman tingkat lanjut.",
    duration: "120 menit",
    questions: 25,
    level: "Sulit",
  },
  {
    id: "to-3",
    title: "Latihan Cepat OSN Informatika - Pemanasan",
    description:
      "Sesi singkat untuk pemanasan sebelum simulasi OSN Informatika penuh.",
    duration: "45 menit",
    questions: 10,
    level: "Mudah",
  },
];

const completedTryouts = [
  {
    id: "ct-1",
    title: "Simulasi OSN Informatika - Tingkat Kabupaten",
    shortTitle: "Kabupaten",
    date: "12 Maret 2026",
    score: 72,
    maxScore: 100,
    percentile: 82,
    summary:
      "Skor 72/100. Performa kuat di algoritma dasar dan logika. Waktu pengerjaan efisien.",
    recap:
      "Soal isian singkat dan pilihan ganda terjawab hampir seluruhnya. Soal nomor 14–16 (struktur data) dan 18 (DP) perlu review.",
  },
  {
    id: "ct-2",
    title: "Simulasi OSN Informatika - Tingkat Provinsi",
    shortTitle: "Provinsi",
    date: "5 Maret 2026",
    score: 68,
    maxScore: 100,
    percentile: 78,
    summary:
      "Skor 68/100. Tingkat kesulitan lebih tinggi; area DP dan graf masih jadi tantangan.",
    recap:
      "Bagian awal (algoritma & kompleksitas) sangat baik. Penurunan skor terutama di 5 soal terakhir (graf dan DP).",
  },
];

const strengthAreas = [
  "Algoritma dasar & logika pemrograman",
  "Pemahaman konsep pemrograman kompetitif",
];
const improvementAreas = [
  "Struktur data lanjutan (tree, graph)",
  "Dynamic programming & optimisasi",
];

const openSchedules = [
  {
    id: "to-1",
    title: "Kabupaten Gelombang 1",
    dateRange: "10–15 Maret 2026",
    closesAt: "Pendaftaran tutup 9 Maret, 21.00 WIB",
  },
  {
    id: "to-2",
    title: "Provinsi Gelombang 1",
    dateRange: "20–24 Maret 2026",
    closesAt: "Pendaftaran tutup 18 Maret, 21.00 WIB",
  },
  {
    id: "to-3",
    title: "Pemanasan Malam",
    dateRange: "Setiap Jumat, 19.30–21.00 WIB",
    closesAt: "1 jam sebelum sesi",
  },
];

export default function StudentDashboardPage() {
  const hasCompletedTO = completedTryouts.length > 0;
  const [selectedTryoutId, setSelectedTryoutId] = useState<string | null>(null);

  const totalTryouts = completedTryouts.length;
  const avgScore =
    totalTryouts > 0
      ? Math.round(
          completedTryouts.reduce((s, t) => s + t.score, 0) / totalTryouts
        )
      : 0;
  const avgPercentile =
    totalTryouts > 0
      ? Math.round(
          completedTryouts.reduce((s, t) => s + t.percentile, 0) / totalTryouts
        )
      : 0;
  const selectedTryout = completedTryouts.find((t) => t.id === selectedTryoutId);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 md:py-8">
        {/* Header ringkas */}
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
              Dashboard OSN Informatika
            </h1>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              Pantau simulasi dan rekomendasi belajar.
            </p>
          </div>
          <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900">
            Target OSN 2026
          </span>
        </header>

        {/* Section 1: Ringkasan (grafik + angka) atau placeholder */}
        <section className="mb-6">
          {hasCompletedTO ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-5">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Ringkasan simulasi
              </h2>
              {/* Grafik skor per tryout (bar chart) */}
              <div className="mt-4">
                <p className="mb-2 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  Skor per simulasi
                </p>
                <div className="flex items-end justify-between gap-2 sm:gap-4">
                  {completedTryouts.map((to) => (
                    <div
                      key={to.id}
                      className="flex flex-1 flex-col items-center gap-1"
                    >
                      <div
                        className="flex w-full items-end justify-center rounded-t bg-zinc-200 dark:bg-zinc-700"
                        style={{ height: "100px" }}
                      >
                        <div
                          className="w-full max-w-[56px] rounded-t bg-emerald-500 dark:bg-emerald-600"
                          style={{
                            height: `${(to.score / 100) * 100}px`,
                            minHeight: to.score > 0 ? "6px" : "0",
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-medium text-zinc-600 dark:text-zinc-300">
                        {to.shortTitle ?? to.title.slice(0, 12)}
                      </span>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                        {to.score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {/* 3 angka dalam satu baris */}
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

        {/* Section 2: Jadwal yang buka */}
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Jadwal simulasi dibuka
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {openSchedules.map((schedule) => (
              <Link
                key={schedule.id}
                href={`/tryout/${schedule.id}`}
                className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
              >
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                  {schedule.title}
                </p>
                <p className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-400">
                  {schedule.dateRange}
                </p>
                <p className="mt-0.5 text-[10px] text-zinc-500 dark:text-zinc-500">
                  {schedule.closesAt}
                </p>
                <span className="mt-2 inline-block text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                  Mulai simulasi →
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Jika belum pernah TO: paket yang bisa dikerjakan (ringkas) */}
        {!hasCompletedTO && (
          <section className="mb-6">
            <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Pilih paket simulasi
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {availableTryouts.map((to) => (
                <Link
                  key={to.id}
                  href={`/tryout/${to.id}`}
                  className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
                >
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                    {to.title}
                  </p>
                  <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                    {to.duration} · {to.questions} soal
                  </p>
                  <span className="mt-2 inline-block text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                    Mulai →
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Jika sudah TO: Riwayat + Rekomendasi (satu layout sederhana) */}
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
                    {completedTryouts.map((to) => (
                      <tr key={to.id}>
                        <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">
                          {to.date}
                        </td>
                        <td className="px-3 py-2 font-medium">
                          {to.shortTitle ?? to.title}
                        </td>
                        <td className="px-3 py-2">
                          <span className="font-semibold">{to.score}</span>
                          <span className="text-zinc-500">/100</span>
                          <span className="ml-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                            {to.percentile}%
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedTryoutId(
                                selectedTryoutId === to.id ? null : to.id
                              )
                            }
                            className="text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
                          >
                            {selectedTryoutId === to.id
                              ? "Sembunyikan"
                              : "Detail"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {selectedTryout && (
                <div className="border-t border-zinc-100 bg-zinc-50/50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/30">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium text-zinc-800 dark:text-zinc-100">
                      {selectedTryout.title}
                    </p>
                    <button
                      type="button"
                      onClick={() => setSelectedTryoutId(null)}
                      className="text-[10px] text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                    >
                      Tutup
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-400">
                    {selectedTryout.summary}
                  </p>
                  <p className="mt-2 text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {selectedTryout.recap}
                  </p>
                </div>
              )}
            </div>

            {/* Satu kartu rekomendasi (gabungan) */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Rekomendasi
              </h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950/30">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                    Kekuatan
                  </p>
                  <ul className="mt-1.5 space-y-0.5 text-[11px] text-emerald-900 dark:text-emerald-100">
                    {strengthAreas.map((a) => (
                      <li key={a}>• {a}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-950/30">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                    Perlu ditingkatkan
                  </p>
                  <ul className="mt-1.5 space-y-0.5 text-[11px] text-amber-900 dark:text-amber-100">
                    {improvementAreas.map((a) => (
                      <li key={a}>• {a}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <p className="mt-3 text-[11px] text-zinc-600 dark:text-zinc-400">
                Fokus latihan: struktur data & graph, lalu dynamic programming.
                Setelah itu coba simulasi provinsi lagi.
              </p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
