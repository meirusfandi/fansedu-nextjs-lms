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
    date: "12 Maret 2026",
    score: 72,
    maxScore: 100,
    percentile: 82,
    summary:
      "Skor 72/100. Performa kuat di algoritma dasar dan logika. Waktu pengerjaan efisien.",
    recap:
      "Soal isian singkat dan pilihan ganda terjawab hampir seluruhnya. Soal nomor 14–16 (struktur data) dan 18 (DP) perlu review. Rata-rata waktu per soal 4,5 menit. Disarankan latihan fokus tree dan graph sebelum simulasi provinsi.",
  },
  {
    id: "ct-2",
    title: "Simulasi OSN Informatika - Tingkat Provinsi",
    date: "5 Maret 2026",
    score: 68,
    maxScore: 100,
    percentile: 78,
    summary:
      "Skor 68/100. Tingkat kesulitan lebih tinggi; area DP dan graf masih jadi tantangan.",
    recap:
      "Bagian awal (algoritma & kompleksitas) sangat baik. Penurunan skor terutama di 5 soal terakhir (graf dan DP). Disarankan mengerjakan ulang paket graf dan berlatih soal DP klasik (knapsack, LIS) sebelum tryout berikutnya.",
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
    title: "Simulasi OSN Informatika - Kabupaten Gelombang 1",
    dateRange: "10–15 Maret 2026",
    closesAt: "Tutup pendaftaran: 9 Maret 2026, 21.00 WIB",
    seatInfo: "Sisa 34 kursi dari 150 peserta",
  },
  {
    id: "to-2",
    title: "Simulasi OSN Informatika - Provinsi Gelombang 1",
    dateRange: "20–24 Maret 2026",
    closesAt: "Tutup pendaftaran: 18 Maret 2026, 21.00 WIB",
    seatInfo: "Sisa 18 kursi dari 120 peserta",
  },
  {
    id: "to-3",
    title: "Latihan Cepat OSN Informatika - Pemanasan Malam",
    dateRange: "Setiap Jumat, 19.30–21.00 WIB",
    closesAt: "Pendaftaran ditutup 1 jam sebelum sesi dimulai",
    seatInfo: "Kapasitas fleksibel, direkomendasikan < 80 peserta/sesi",
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
    <div className="flex min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 md:px-8 md:py-8">
        {/* Header */}
        <header className="mb-6 flex flex-col gap-3 md:mb-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
              Dashboard peserta OSN Informatika
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
              Selamat datang kembali, Peserta OSN!
            </h1>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              Pantau progres simulasi OSN Informatika dan dapatkan rekomendasi
              belajar berikutnya.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="rounded-full bg-zinc-900 px-3 py-1.5 font-medium text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900">
              Target OSN Informatika 2026
            </div>
          </div>
        </header>

        {/* Jadwal simulasi OSN yang masih buka */}
        <section className="mb-8 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold tracking-tight">
                Jadwal simulasi OSN Informatika yang masih dibuka
              </h2>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                Pilih jadwal yang paling cocok dengan kegiatan sekolah dan
                latihan pribadimu.
              </p>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Semua waktu dalam zona waktu{" "}
              <span className="font-medium">WIB (UTC+7)</span>.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {openSchedules.map((schedule) => (
              <article
                key={schedule.id}
                className="flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-4 text-xs shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
              >
                <h3 className="text-sm font-semibold tracking-tight">
                  {schedule.title}
                </h3>
                <p className="mt-2 text-[11px] font-medium text-zinc-800 dark:text-zinc-100">
                  {schedule.dateRange}
                </p>
                <p className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-400">
                  {schedule.closesAt}
                </p>
                <p className="mt-2 text-[11px] text-zinc-600 dark:text-zinc-400">
                  {schedule.seatInfo}
                </p>
                <Link
                  href={`/tryout/${schedule.id}`}
                  className="mt-4 inline-flex items-center justify-center rounded-lg bg-zinc-900 px-3 py-1.5 text-[11px] font-semibold text-zinc-50 shadow-sm transition hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  Lihat &amp; mulai simulasi
                </Link>
              </article>
            ))}
          </div>
        </section>

        {/* Jika belum pernah mengerjakan TO */}
        {!hasCompletedTO && (
          <section className="space-y-5">
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-4 py-5 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:px-6">
              <h2 className="text-sm font-semibold tracking-tight">
                Mulai dari Simulasi OSN Pertamamu
              </h2>
              <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                Kamu belum pernah mengerjakan simulasi OSN Informatika (TO).
                Pilih salah satu paket di bawah ini untuk melihat kemampuan
                awalmu dan mendapatkan rekomendasi belajar yang
                dipersonalisasi.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {availableTryouts.map((to) => (
                <article
                  key={to.id}
                  className="flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-4 text-xs shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <h3 className="text-sm font-semibold tracking-tight">
                    {to.title}
                  </h3>
                  <p className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-400">
                    {to.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-900">
                      {to.duration}
                    </span>
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-900">
                      {to.questions} soal
                    </span>
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-900">
                      Level: {to.level}
                    </span>
                  </div>
                  <button className="mt-4 inline-flex items-center justify-center rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-50 shadow-sm transition hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200">
                    Mulai Simulasi
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Jika sudah pernah mengerjakan TO */}
        {hasCompletedTO && (
          <section className="space-y-6">
            {/* Kesimpulan semua tryout */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                Kesimpulan semua tryout
              </h2>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                Ringkasan gabungan dari seluruh simulasi OSN Informatika yang
                sudah kamu kerjakan.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-zinc-50 px-4 py-3 dark:bg-zinc-900/80">
                  <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                    Total simulasi selesai
                  </p>
                  <p className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                    {totalTryouts}
                  </p>
                </div>
                <div className="rounded-xl bg-zinc-50 px-4 py-3 dark:bg-zinc-900/80">
                  <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                    Skor rata-rata
                  </p>
                  <p className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                    {avgScore}
                    <span className="ml-1 text-sm font-normal text-zinc-500">
                      / 100
                    </span>
                  </p>
                </div>
                <div className="rounded-xl bg-zinc-50 px-4 py-3 dark:bg-zinc-900/80">
                  <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                    Persentil rata-rata
                  </p>
                  <p className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                    {avgPercentile}
                    <span className="ml-1 text-sm font-normal text-zinc-500">
                      %
                    </span>
                  </p>
                </div>
              </div>
              <p className="mt-4 text-xs text-zinc-600 dark:text-zinc-400">
                Klik &quot;Lihat detail&quot; pada tabel di bawah untuk melihat ringkasan
                dan rangkuman per tryout.
              </p>
            </div>

            {/* Ringkasan hasil TO */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Skor rata-rata simulasi OSN
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">
                  703
                </p>
                <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                  +28 poin dibandingkan percobaan pertama
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Persentil nasional
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">
                  81
                  <span className="ml-1 text-sm align-middle text-zinc-500">
                    %
                  </span>
                </p>
                <p className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-400">
                  Lebih baik dari 81% peserta lainnya.
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Konsistensi belajar
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">
                  4x/minggu
                </p>
                <p className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-400">
                  Direkomendasikan minimal 3x/minggu untuk progress stabil.
                </p>
              </div>
            </div>

            {/* Grid utama: hasil detail + rekomendasi AI */}
            <div className="grid gap-4 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1.3fr)]">
              {/* History TO + distribusi skor */}
              <div className="space-y-4">
                <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-semibold tracking-tight">
                        Riwayat Tryout Online
                      </h2>
                      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                        Lihat perkembangan skor dan jadwal pengerjaan TO.
                      </p>
                    </div>
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                      {completedTryouts.length} percobaan
                    </span>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-zinc-100 text-xs dark:border-zinc-800">
                    <table className="min-w-full divide-y divide-zinc-100 dark:divide-zinc-900">
                      <thead className="bg-zinc-50/80 dark:bg-zinc-950/60">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-zinc-500">
                            Tanggal
                          </th>
                          <th className="px-3 py-2 text-left font-medium text-zinc-500">
                            Paket TO
                          </th>
                          <th className="px-3 py-2 text-left font-medium text-zinc-500">
                            Skor
                          </th>
                          <th className="px-3 py-2 text-left font-medium text-zinc-500">
                            Persentil
                          </th>
                          <th className="px-3 py-2 text-right font-medium text-zinc-500">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 bg-white dark:divide-zinc-900 dark:bg-zinc-950">
                        {completedTryouts.map((to) => (
                          <tr key={to.id}>
                            <td className="px-3 py-2 align-top text-[11px] text-zinc-600 dark:text-zinc-400">
                              {to.date}
                            </td>
                            <td className="px-3 py-2 align-top text-[11px] font-medium">
                              {to.title}
                            </td>
                            <td className="px-3 py-2 align-top text-[11px]">
                              <span className="font-semibold">
                                {to.score}
                              </span>
                              <span className="text-zinc-500">
                                {" "}
                                / {to.maxScore}
                              </span>
                            </td>
                            <td className="px-3 py-2 align-top text-[11px]">
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                {to.percentile}%
                              </span>
                            </td>
                            <td className="px-3 py-2 align-top text-right text-[11px]">
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedTryoutId(
                                    selectedTryoutId === to.id ? null : to.id
                                  )
                                }
                                className="font-medium text-zinc-700 underline-offset-2 hover:underline dark:text-zinc-300"
                              >
                                {selectedTryoutId === to.id
                                  ? "Sembunyikan"
                                  : "Lihat detail"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {selectedTryout && (
                    <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-900/50">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                          Ringkasan &amp; rangkuman — {selectedTryout.title}
                        </h3>
                        <button
                          type="button"
                          onClick={() => setSelectedTryoutId(null)}
                          className="rounded-lg border border-zinc-200 px-2 py-1 text-[10px] font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                        >
                          Tutup
                        </button>
                      </div>
                      <div className="mt-3 space-y-3 text-xs">
                        <div>
                          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                            Ringkasan
                          </p>
                          <p className="mt-1 text-zinc-700 dark:text-zinc-200">
                            {selectedTryout.summary ??
                              `Skor ${selectedTryout.score}/${selectedTryout.maxScore}, persentil ${selectedTryout.percentile}%.`}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                            Rangkuman
                          </p>
                          <p className="mt-1 leading-relaxed text-zinc-700 dark:text-zinc-200">
                            {selectedTryout.recap ??
                              "Detail analisis per soal dan rekomendasi latihan tersedia setelah integrasi backend."}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <h2 className="text-sm font-semibold tracking-tight">
                    Kekuatan & area yang perlu ditingkatkan
                  </h2>
                  <div className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-100">
                      <p className="text-[11px] font-semibold uppercase tracking-wide">
                        Kekuatan utama
                      </p>
                      <ul className="mt-2 space-y-1">
                        {strengthAreas.map((area) => (
                          <li key={area} className="flex items-start gap-1.5">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            <span>{area}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
                      <p className="text-[11px] font-semibold uppercase tracking-wide">
                        Perlu ditingkatkan
                      </p>
                      <ul className="mt-2 space-y-1">
                        {improvementAreas.map((area) => (
                          <li key={area} className="flex items-start gap-1.5">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500" />
                            <span>{area}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Insight AI & rekomendasi belajar */}
              <aside className="space-y-4">
                <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h2 className="text-sm font-semibold tracking-tight">
                      Ringkasan AI dari hasil TO
                    </h2>
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                      Beta
                    </span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Berdasarkan pola jawaban dan perbandingan dengan
                    peserta-peserta OSN Informatika lainnya, berikut adalah
                    gambaran kemampuanmu saat ini:
                  </p>
                  <ul className="mt-3 space-y-2 text-xs">
                    <li className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <p>
                        Skor kamu konsisten di atas rata-rata peserta lain,
                        terutama pada{" "}
                        <span className="font-medium">
                          algoritma dasar dan pemahaman konsep pemrograman
                        </span>
                        .
                      </p>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500" />
                      <p>
                        Area{" "}
                        <span className="font-medium">
                          struktur data lanjutan (tree, graph)
                        </span>{" "}
                        dan{" "}
                        <span className="font-medium">
                          dynamic programming
                        </span>{" "}
                        masih fluktuatif dan cenderung menurun di soal-soal
                        level sulit OSN.
                      </p>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500" />
                      <p>
                        Pola waktu menunjukkan kamu sering kehabisan waktu di
                        bagian akhir simulasi. Manajemen waktu menjadi kunci
                        untuk menaikkan skor OSN-mu.
                      </p>
                    </li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <h2 className="text-sm font-semibold tracking-tight">
                    Rekomendasi belajar selanjutnya
                  </h2>
                  <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                    Rencana belajar 7 hari ke depan yang disarankan:
                  </p>
                  <ul className="mt-3 space-y-2 text-xs">
                    <li>
                      <span className="font-medium">Hari 1–2:</span> fokus
                      latihan{" "}
                      <span className="font-medium">
                        algoritma dasar & implementasi
                      </span>{" "}
                      (minimal 4–5 soal pemrograman/hari).
                    </li>
                    <li>
                      <span className="font-medium">Hari 3–4:</span> latihan{" "}
                      <span className="font-medium">
                        struktur data & graph
                      </span>{" "}
                      (tree, graph traversal, shortest path sederhana).
                    </li>
                    <li>
                      <span className="font-medium">Hari 5:</span> fokus{" "}
                      <span className="font-medium">dynamic programming</span>{" "}
                      pada soal-soal klasik (knapsack, longest subsequence,
                      dsb).
                    </li>
                    <li>
                      <span className="font-medium">Hari 6–7:</span> simulasi
                      OSN Informatika 1 set penuh, lalu review soal-soal yang
                      salah dan tandai pola kesalahanmu.
                    </li>
                  </ul>
                  <button className="mt-3 inline-flex items-center justify-center rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900">
                    Lihat jadwal belajar detail
                  </button>
                </div>
              </aside>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

