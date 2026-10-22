"use client";

import { useState } from "react";

export default function ParentKehadiranPage() {
  const [filterMonth, setFilterMonth] = useState("2026-10");

  const sessions = [
    {
      id: "1",
      date: "Selasa, 22 Okt 2026",
      time: "16:00 - 17:30 WIB",
      subject: "OSN Informatika",
      topic: "Dynamic Programming: Knapsack Problem & Memoization",
      status: "Hadir",
      statusColor: "emerald",
      tutor: "Kak Rian Maulana, S.Kom",
      tutorNote: "Ahmad aktif sekali dan berhasil menyelesaikan latihan soal olimpiade nomor 1-4 secara mandiri.",
    },
    {
      id: "2",
      date: "Kamis, 17 Okt 2026",
      time: "16:00 - 17:30 WIB",
      subject: "OSN Informatika",
      topic: "Algoritma Greedy & Interval Scheduling",
      status: "Hadir",
      statusColor: "emerald",
      tutor: "Kak Rian Maulana, S.Kom",
      tutorNote: "Pemahaman logika greedy sudah mantap, perlu latihan sedikit di pembuktian greedy choice property.",
    },
    {
      id: "3",
      date: "Selasa, 15 Okt 2026",
      time: "16:00 - 17:30 WIB",
      subject: "OSN Informatika",
      topic: "Struktur Data Tree & Binary Search Tree (BST)",
      status: "Hadir",
      statusColor: "emerald",
      tutor: "Kak Rian Maulana, S.Kom",
      tutorNote: "Fokus belajar implementasi BST di C++ STL std::set dan std::map.",
    },
    {
      id: "4",
      date: "Kamis, 10 Okt 2026",
      time: "16:00 - 17:30 WIB",
      subject: "OSN Informatika",
      topic: "Divide and Conquer: Merge Sort & Counting Inversions",
      status: "Izin",
      statusColor: "amber",
      tutor: "Kak Rian Maulana, S.Kom",
      tutorNote: "Izin ada kegiatan ekstrakurikuler sekolah. Materi dan rekaman sudah dikirimkan untuk dipelajari mandiri.",
    },
    {
      id: "5",
      date: "Selasa, 08 Okt 2026",
      time: "16:00 - 17:30 WIB",
      subject: "OSN Informatika",
      topic: "Rekursi dan Backtracking Dasar (N-Queens Problem)",
      status: "Hadir",
      statusColor: "emerald",
      tutor: "Kak Rian Maulana, S.Kom",
      tutorNote: "Mengerjakan tugas coding dengan baik dan rapi.",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Rekap Kehadiran Les</h1>
          <p className="text-sm text-zinc-500">
            Jurnal sesi pertemuan, topik yang dipelajari, dan catatan guru pengajar bimbingan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="filterMonth" className="text-xs font-medium text-zinc-600">Periode:</label>
          <select
            id="filterMonth"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 shadow-xs outline-none cursor-pointer"
          >
            <option value="2026-10">Oktober 2026</option>
            <option value="2026-09">September 2026</option>
            <option value="2026-08">Agustus 2026</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-medium text-zinc-500">Total Sesi Terjadwal</p>
          <p className="mt-1 text-2xl font-bold text-zinc-900">12 Sesi</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-xs">
          <p className="text-xs font-medium text-emerald-800">Sesi Hadir</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">11 Sesi</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4 shadow-xs">
          <p className="text-xs font-medium text-amber-800">Sesi Izin / Sakit</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">1 Sesi</p>
        </div>
        <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-4 shadow-xs">
          <p className="text-xs font-medium text-sky-800">Persentase Kehadiran</p>
          <p className="mt-1 text-2xl font-bold text-sky-700">92%</p>
        </div>
      </div>

      {/* Table Sesi */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs">
        <div className="border-b border-zinc-200 px-6 py-4">
          <h2 className="text-sm font-bold text-zinc-900">Riwayat Pertemuan Sesi Les</h2>
        </div>
        <div className="divide-y divide-zinc-100">
          {sessions.map((s) => (
            <div key={s.id} className="p-5 transition hover:bg-zinc-50/80">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-zinc-800">{s.date}</span>
                    <span className="text-xs text-zinc-400">•</span>
                    <span className="text-xs text-zinc-500">{s.time}</span>
                  </div>
                  <h3 className="mt-1 text-sm font-bold text-zinc-900">{s.topic}</h3>
                  <p className="text-xs text-zinc-500">Mata Pelajaran: {s.subject} | Tutor: {s.tutor}</p>
                </div>
                <div>
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                      s.status === "Hadir"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {s.status}
                  </span>
                </div>
              </div>

              {s.tutorNote && (
                <div className="mt-3 rounded-xl border border-zinc-100 bg-zinc-50 p-3 text-xs text-zinc-700">
                  <span className="font-semibold text-zinc-900">Catatan Guru: </span>
                  <span className="italic">{s.tutorNote}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
