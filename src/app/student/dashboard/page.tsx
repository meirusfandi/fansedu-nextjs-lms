"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth";
import { logout } from "@/services/auth";

export default function StudentDashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [openTryouts] = useState([
    {
      id: "to-osn-k-3",
      title: "Simulasi Tryout Nasional OSN-K Informatika 2026 #3",
      duration: "90 Menit",
      questionsCount: 30,
      level: "Tingkat Kabupaten / Kota",
      closesAt: "28 Oktober 2026, 23:59 WIB",
      isFree: true,
      status: "open",
    },
    {
      id: "to-osn-k-2",
      title: "Latihan Soal Algoritma Graf & Shortest Path",
      duration: "60 Menit",
      questionsCount: 20,
      level: "Latihan Terarah",
      closesAt: "31 Oktober 2026, 23:59 WIB",
      isFree: true,
      status: "open",
    },
  ]);

  const [activeCourses] = useState([
    {
      id: "c-1",
      title: "Pelatihan Intensif OSN-K 2026 Informatika",
      progress: 68,
      nextMeeting: "Kamis, 24 Okt 2026 (16:00 WIB)",
      tutor: "Kak Rian Maulana, S.Kom",
      zoomUrl: "https://zoom.us/j/fansedu-osn",
    },
    {
      id: "c-2",
      title: "Algorithm & Programming Foundation (C++)",
      progress: 100,
      nextMeeting: "Kelas Selesai (Rekaman Tersedia)",
      tutor: "Tim Pembina FansEdu",
      zoomUrl: null,
    },
  ]);

  const [recentAttempts] = useState([
    {
      id: "att-1",
      title: "Simulasi Tryout OSN-K Informatika #2",
      score: 84.5,
      rank: 18,
      percentile: 95.7,
      date: "14 Okt 2026",
    },
    {
      id: "att-2",
      title: "Latihan Struktur Data Tree & Map",
      score: 90.0,
      rank: 8,
      percentile: 98.1,
      date: "05 Okt 2026",
    },
  ]);

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 text-zinc-900 [color-scheme:light]">
      {/* Student Top Bar */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-600 to-indigo-700 font-bold text-white shadow-sm">
              FE
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-zinc-900">FansEdu LMS</span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                  Portal Siswa
                </span>
              </div>
              <p className="text-xs text-zinc-500">Akademi Olimpiade Sains &amp; Pemrograman</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-bold text-zinc-900">{user?.name || "Siswa Bimbingan"}</p>
              <p className="text-[10px] text-zinc-500">{user?.email || "siswa@fansedu.id"}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 hover:text-red-600 transition"
            >
              Keluar
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Hero Card Siswa */}
        <div className="rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-600 to-indigo-700 p-6 text-white shadow-sm">
          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-xs">
            Persiapan OSN 2026
          </span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">
            Selamat Datang, {user?.name || "Siswa Juara"}!
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-sky-100">
            Fokus raih medali! Kerjakan simulasi tryout berkala, ikuti sesi live class bimbingan, dan tinjau pembahasan soal yang masih salah.
          </p>
        </div>

        {/* 2 Grid: Tryout Terbuka & Jadwal Belajar */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main 2 Cols: Tryout & Materi */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tryout Terbuka */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-zinc-900">Simulasi Tryout Tersedia</h2>
                  <p className="text-xs text-zinc-500">Uji kemampuan dan raih peringkat nasional</p>
                </div>
                <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700">
                  {openTryouts.length} Terbuka
                </span>
              </div>

              <div className="space-y-3">
                {openTryouts.map((to) => (
                  <div
                    key={to.id}
                    className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 transition hover:border-sky-300 hover:bg-sky-50/30 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-800">
                          {to.duration}
                        </span>
                        <span className="text-xs text-zinc-500">{to.questionsCount} Soal</span>
                        <span className="text-xs text-zinc-400">•</span>
                        <span className="text-xs text-emerald-600 font-medium">Gratis</span>
                      </div>
                      <h3 className="mt-1.5 text-sm font-bold text-zinc-900">{to.title}</h3>
                      <p className="text-xs text-zinc-500">Batas Waktu: {to.closesAt}</p>
                    </div>

                    <Link
                      href={`/tryout/${to.id}`}
                      className="inline-flex shrink-0 items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-sky-700 transition"
                    >
                      Mulai Tryout →
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Kursus & Live Class */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs">
              <h2 className="text-base font-bold text-zinc-900 mb-4">Program &amp; Kelas Bimbingan Saya</h2>
              <div className="space-y-4">
                {activeCourses.map((c) => (
                  <div key={c.id} className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-zinc-900">{c.title}</h3>
                        <p className="text-xs text-zinc-500">Tutor: {c.tutor}</p>
                      </div>
                      {c.zoomUrl && (
                        <a
                          href={c.zoomUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition"
                        >
                          <span>📹 Masuk Live Class</span>
                        </a>
                      )}
                    </div>

                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-zinc-500 mb-1">
                        <span>Progres Belajar</span>
                        <span className="font-semibold text-zinc-800">{c.progress}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200">
                        <div
                          className="h-full rounded-full bg-sky-600"
                          style={{ width: `${c.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Riwayat Nilai & Peringkat */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs">
              <h2 className="text-base font-bold text-zinc-900 mb-4">Hasil Tryout Terakhir</h2>
              <div className="space-y-3">
                {recentAttempts.map((att) => (
                  <div key={att.id} className="rounded-xl border border-zinc-100 bg-zinc-50 p-3.5">
                    <p className="text-[10px] text-zinc-400">{att.date}</p>
                    <h3 className="text-xs font-bold text-zinc-900 line-clamp-1">{att.title}</h3>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-lg font-black text-sky-600">{att.score}</span>
                      <span className="rounded-md bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-800">
                        Peringkat #{att.rank}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-xl border border-teal-100 bg-teal-50/60 p-3 text-xs text-teal-950">
                <p className="font-semibold text-teal-900">Tips Olimpiade OSN:</p>
                <p className="mt-1 text-[11px] leading-relaxed text-teal-800">
                  Fokus pada materi dengan bobot soal tertinggi: Graf (BFS/DFS), Dynamic Programming, dan Teori Bilangan dasar.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
