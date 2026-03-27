"use client";

import { useState } from "react";

const MOCK_TARGET_SISWA = [
  { bulan: "Februari 2026", target_lulus: 12, actual: 10, progress: 83 },
  { bulan: "Januari 2026", target_lulus: 15, actual: 14, progress: 93 },
  { bulan: "Desember 2025", target_lulus: 10, actual: 9, progress: 90 },
];

const MOCK_PEMBELIAN = [
  { bulan: "Februari 2026", kelas: "Algoritma Dasar", pembelian: 28, revenue: "Rp 8.400.000" },
  { bulan: "Februari 2026", kelas: "Struktur Data", pembelian: 15, revenue: "Rp 4.500.000" },
  { bulan: "Januari 2026", kelas: "Algoritma Dasar", pembelian: 42, revenue: "Rp 12.600.000" },
];

export default function AdminReportPage() {
  const [month, setMonth] = useState("2026-02");

  return (
    <div className="px-4 py-5 text-zinc-900 sm:px-6 md:px-8 md:py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 md:mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Report
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
              Laporan Bulanan
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              Target siswa dan pembelian kelas per bulan.
            </p>
          </div>
          <div className="flex items-center gap-2 [color-scheme:light]">
            <label className="text-xs font-medium text-zinc-700">
              Bulan
            </label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            />
          </div>
        </div>

        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-zinc-900">
            Target Siswa (lulus / sertifikasi)
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-zinc-200 text-sm text-zinc-900">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">
                    Bulan
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">
                    Target
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">
                    Actual
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">
                    Progress
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {MOCK_TARGET_SISWA.map((row) => (
                  <tr key={row.bulan}>
                    <td className="px-4 py-3 font-medium text-zinc-900">{row.bulan}</td>
                    <td className="px-4 py-3 text-zinc-900">{row.target_lulus}</td>
                    <td className="px-4 py-3 text-zinc-900">{row.actual}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 ">
                        {row.progress}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-zinc-900">
            Pembelian Kelas
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-zinc-200 text-sm text-zinc-900">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">
                    Bulan
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">
                    Kelas
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">
                    Jumlah pembelian
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {MOCK_PEMBELIAN.map((row, i) => (
                  <tr key={`${row.bulan}-${row.kelas}-${i}`}>
                    <td className="px-4 py-3 font-medium text-zinc-900">{row.bulan}</td>
                    <td className="px-4 py-3 text-zinc-900">{row.kelas}</td>
                    <td className="px-4 py-3 text-zinc-900">{row.pembelian}</td>
                    <td className="px-4 py-3 text-zinc-900">{row.revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-zinc-600">
            Data di atas contoh. Integrasi dengan backend untuk laporan real-time.
          </p>
        </section>
    </div>
  );
}
