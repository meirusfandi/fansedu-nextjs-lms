"use client";

import { useState } from "react";

export default function ParentRaporPage() {
  const [activeTab, setActiveTab] = useState<"rapor" | "tryout">("rapor");

  const progressReport = {
    period: "Periode Oktober 2026",
    studentName: "Ahmad Fauzi",
    school: "SMA Negeri 1 Yogyakarta",
    grade: "Kelas X",
    subject: "Olimpiade Sains Nasional (OSN) Bidang Informatika",
    tutorName: "Kak Rian Maulana, S.Kom",
    attendanceRate: 92,
    sessionsCount: 12,
    strengths: [
      "Pemahaman konsep rekursi & dynamic programming sangat cepat.",
      "Kemampuan implementasi sintaks C++ STL (vector, map, set, priority_queue) sudah rapi.",
      "Memiliki persistensi tinggi saat men-debug kode yang runtime error.",
    ],
    improvements: [
      "Perlu latihan membaca soal cerita olimpiade yang panjang agar tidak salah mengasumsikan batasan (constraints).",
      "Perlu memperdalam teknik optimasi kompleksitas waktu algoritma (Time Complexity O(N log N) vs O(N^2)).",
    ],
    recommendation:
      "Ahmad direkomendasikan untuk mengikuti Simulasi Tryout OSN-K Informatika #3 pada akhir pekan ini dan melanjutkan modul materi Graph & Shortest Path.",
  };

  const tryoutScores = [
    {
      id: "to-1",
      title: "Simulasi Tryout OSN-K Informatika #2 (Oktober 2026)",
      score: 84.5,
      maxScore: 100,
      rank: 18,
      totalParticipants: 420,
      status: "Selesai",
      date: "14 Okt 2026",
      strengths: "Algoritma Dasar, Logika Boolean, Rekursi",
      weakness: "Kombinatorika & Problem Batasan Memori",
    },
    {
      id: "to-2",
      title: "Simulasi Tryout OSN-K Informatika #1 (September 2026)",
      score: 72.0,
      maxScore: 100,
      rank: 45,
      totalParticipants: 395,
      status: "Selesai",
      date: "28 Sep 2026",
      strengths: "Struktur Data Array & String",
      weakness: "Dynamic Programming Dasar",
    },
    {
      id: "to-3",
      title: "Pretest Diagnostik Algoritma Awal (Agustus 2026)",
      score: 61.0,
      maxScore: 100,
      rank: 82,
      totalParticipants: 380,
      status: "Selesai",
      date: "15 Agu 2026",
      strengths: "Dasar Pemrograman C++",
      weakness: "Problem Solving Olimpiade",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">E-Raport &amp; Hasil Tryout</h1>
          <p className="text-sm text-zinc-500">
            Laporan perkembangan capaian belajar anak dan rekap skor simulasi olimpiade.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-xl border border-zinc-200 bg-white p-1 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab("rapor")}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition ${
              activeTab === "rapor"
                ? "bg-sky-600 text-white"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            E-Raport Les Bulanan
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("tryout")}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition ${
              activeTab === "tryout"
                ? "bg-sky-600 text-white"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            Riwayat Tryout OSN
          </button>
        </div>
      </div>

      {activeTab === "rapor" ? (
        <div className="space-y-6">
          {/* Header Rapor */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs">
            <div className="flex flex-col gap-4 border-b border-zinc-100 pb-5 md:flex-row md:items-center md:justify-between">
              <div>
                <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800">
                  {progressReport.period}
                </span>
                <h2 className="mt-2 text-xl font-bold text-zinc-900">{progressReport.studentName}</h2>
                <p className="text-xs text-zinc-500">
                  {progressReport.school} • {progressReport.grade}
                </p>
              </div>
              <div className="text-left md:text-right">
                <p className="text-xs font-semibold text-zinc-900">Bidang Bimbingan</p>
                <p className="text-sm font-bold text-sky-600">{progressReport.subject}</p>
                <p className="text-xs text-zinc-500">Tutor: {progressReport.tutorName}</p>
              </div>
            </div>

            {/* Skor & Kehadiran Bar */}
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                <p className="text-xs font-medium text-zinc-500">Kehadiran Selama Periode</p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex-1 overflow-hidden rounded-full bg-zinc-200 h-3">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${progressReport.attendanceRate}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-zinc-900">{progressReport.attendanceRate}%</span>
                </div>
                <p className="mt-1 text-[11px] text-zinc-500">{progressReport.sessionsCount} Sesi les telah diselesaikan</p>
              </div>

              <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                <p className="text-xs font-medium text-zinc-500">Status Capaian Belajar</p>
                <p className="mt-1 text-base font-bold text-emerald-600">Sangat Memuaskan (Optimal)</p>
                <p className="text-[11px] text-zinc-500">Menguasai 85% kompetensi silabus OSN-K tingkat Kabupaten</p>
              </div>
            </div>

            {/* Kekuatan & Area Pengembangan */}
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-5">
                <h3 className="flex items-center gap-2 text-sm font-bold text-emerald-900">
                  <span>✓</span>
                  <span>Kekuatan &amp; Penguasaan Materi</span>
                </h3>
                <ul className="mt-3 space-y-2 text-xs text-emerald-950">
                  {progressReport.strengths.map((str, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-5">
                <h3 className="flex items-center gap-2 text-sm font-bold text-amber-900">
                  <span>✎</span>
                  <span>Hal yang Perlu Ditingkatkan</span>
                </h3>
                <ul className="mt-3 space-y-2 text-xs text-amber-950">
                  {progressReport.improvements.map((imp, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-600 font-bold">•</span>
                      <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Rekomendasi Guru */}
            <div className="mt-6 rounded-xl border border-sky-100 bg-sky-50/50 p-5">
              <h3 className="text-xs font-bold uppercase tracking-wide text-sky-900">Rekomendasi Tindak Lanjut Guru</h3>
              <p className="mt-2 text-xs leading-relaxed text-sky-950 italic">
                &ldquo;{progressReport.recommendation}&rdquo;
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Tab Tryout Scores */
        <div className="space-y-4">
          {tryoutScores.map((to) => (
            <div
              key={to.id}
              className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs transition hover:border-sky-300"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-600">
                      {to.date}
                    </span>
                    <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                      {to.status}
                    </span>
                  </div>
                  <h3 className="mt-1.5 text-base font-bold text-zinc-900">{to.title}</h3>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-zinc-400">Nilai Akhir</p>
                    <p className="text-2xl font-black text-sky-600">
                      {to.score} <span className="text-xs font-normal text-zinc-400">/ 100</span>
                    </p>
                  </div>
                  <div className="rounded-xl bg-sky-50 px-3.5 py-2 text-center">
                    <p className="text-[10px] font-semibold text-sky-700">Peringkat</p>
                    <p className="text-sm font-extrabold text-sky-900">#{to.rank}</p>
                    <p className="text-[9px] text-sky-600">dari {to.totalParticipants}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 border-t border-zinc-100 pt-3 text-xs sm:grid-cols-2">
                <div>
                  <span className="font-semibold text-emerald-700">Topik Terkuat: </span>
                  <span className="text-zinc-600">{to.strengths}</span>
                </div>
                <div>
                  <span className="font-semibold text-amber-700">Perlu Latihan: </span>
                  <span className="text-zinc-600">{to.weakness}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
