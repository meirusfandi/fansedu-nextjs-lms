"use client";

import Link from "next/link";
import { useState } from "react";

export default function ParentDashboardPage() {
  const [stats] = useState({
    kehadiranPct: 92,
    totalSesiBulanIni: 12,
    hadirSesi: 11,
    skorTryoutTerakhir: 84.5,
    peringkatNasional: "Peringkat 18 dari 420 Peserta",
    tagihanStatus: "Lunas",
    tagihanBulan: "Oktober 2026",
    guruPengajar: "Kak Rian Maulana, S.Kom (Trainer OSN)",
  });

  const upcomingClasses = [
    {
      date: "Kamis, 24 Okt 2026",
      time: "16:00 - 17:30 WIB",
      subject: "OSN Informatika - Graf & Algoritma Dijkstra",
      tutor: "Kak Rian Maulana",
      status: "Terkonfirmasi",
    },
    {
      date: "Sabtu, 26 Okt 2026",
      time: "10:00 - 12:00 WIB",
      subject: "Simulasi Tryout OSN-K Informatika #3",
      tutor: "Sistem FansEdu CBT",
      status: "Terjadwal",
    },
  ];

  const recentAttendances = [
    {
      date: "22 Okt 2026",
      title: "Dynamic Programming (Knapsack & Coin Change)",
      status: "Hadir",
      tutorNote: "Ahmad sangat cepat memahami konsep rekursi memoization, latihan soal selesai 100%.",
    },
    {
      date: "18 Okt 2026",
      title: "Binary Search & Rekursi Dasar",
      status: "Hadir",
      tutorNote: "Aktif bertanya dan diskusi logika rekursif.",
    },
    {
      date: "15 Okt 2026",
      title: "Struktur Data Stack & Queue",
      status: "Hadir",
      tutorNote: "Menyelesaikan 4 problem olimpiade tingkat kabupaten dengan baik.",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-500 via-sky-600 to-indigo-600 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-xs">
              Dashboard Perkembangan Anak
            </span>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">
              Halo, Orang Tua Ahmad Fauzi
            </h1>
            <p className="mt-1 text-sm text-sky-100">
              Berikut ringkasan aktivitas belajar, kehadiran kelas les, dan evaluasi hasil belajar anak Anda.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/parent/rapor"
              className="rounded-xl bg-white px-4 py-2 text-xs font-semibold text-sky-700 shadow-xs hover:bg-sky-50 transition"
            >
              Lihat E-Raport Les →
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Kehadiran */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Tingkat Kehadiran
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 font-bold">
              ✓
            </span>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-zinc-900">{stats.kehadiranPct}%</p>
          <p className="mt-1 text-xs text-zinc-500">
            {stats.hadirSesi} dari {stats.totalSesiBulanIni} sesi dihadiri bulan ini
          </p>
          <div className="mt-3">
            <Link href="/parent/kehadiran" className="text-xs font-semibold text-sky-600 hover:underline">
              Detail riwayat kehadiran →
            </Link>
          </div>
        </div>

        {/* Skor Tryout */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Skor Tryout Terakhir
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600 font-bold">
              ★
            </span>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-zinc-900">{stats.skorTryoutTerakhir}</p>
          <p className="mt-1 text-xs text-emerald-600 font-medium">
            {stats.peringkatNasional}
          </p>
          <div className="mt-3">
            <Link href="/parent/rapor" className="text-xs font-semibold text-sky-600 hover:underline">
              Analisis nilai &amp; soal →
            </Link>
          </div>
        </div>

        {/* Status SPP */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Status Biaya Les
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600 font-bold">
              $
            </span>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-emerald-600">{stats.tagihanStatus}</p>
          <p className="mt-1 text-xs text-zinc-500">Periode {stats.tagihanBulan}</p>
          <div className="mt-3">
            <Link href="/parent/tagihan" className="text-xs font-semibold text-sky-600 hover:underline">
              Cek tagihan &amp; bukti transfer →
            </Link>
          </div>
        </div>

        {/* Guru Pembimbing */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Guru Pembimbing
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 font-bold">
              👤
            </span>
          </div>
          <p className="mt-2 text-sm font-bold text-zinc-900 line-clamp-1">{stats.guruPengajar}</p>
          <p className="mt-1 text-xs text-zinc-500">Terdaftar via TeachSync</p>
          <div className="mt-3">
            <a
              href="https://wa.me/6285121277161?text=Halo%20Kak%20Rian,%20saya%20orang%20tua%20Ahmad%20Fauzi%20ingin%20berkonsultasi"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline"
            >
              <span>Hubungi Guru via WA</span>
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.38 5.08L2 22l5.09-1.34C8.54 21.52 10.22 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* 2 Column Details: Upcoming Schedule & Recent Attendances */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Jadwal Terdekat */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-zinc-900">Jadwal Sesi Mendatang</h2>
            <span className="text-xs text-zinc-500">Sinkron TeachSync</span>
          </div>
          <div className="space-y-3">
            {upcomingClasses.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between rounded-xl border border-zinc-100 bg-zinc-50 p-4 transition hover:bg-sky-50/50"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-800">
                      {item.date}
                    </span>
                    <span className="text-xs text-zinc-500">{item.time}</span>
                  </div>
                  <h3 className="mt-1.5 text-sm font-semibold text-zinc-900">{item.subject}</h3>
                  <p className="text-xs text-zinc-500">Pengajar: {item.tutor}</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Catatan Guru Terakhir */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-zinc-900">Catatan Guru Pertemuan Terakhir</h2>
            <Link href="/parent/kehadiran" className="text-xs font-semibold text-sky-600 hover:underline">
              Lihat Semua
            </Link>
          </div>
          <div className="space-y-3">
            {recentAttendances.map((item, idx) => (
              <div key={idx} className="rounded-xl border border-zinc-100 bg-zinc-50 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-800">{item.title}</span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
                    {item.status} ({item.date})
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-zinc-600 italic">
                  &ldquo;{item.tutorNote}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
