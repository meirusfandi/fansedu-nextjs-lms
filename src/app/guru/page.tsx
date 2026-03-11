"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAuthUserName, getTrainerStatus, getFriendlyApiErrorMessage } from "@/lib/api";

export default function GuruDashboardPage() {
  const [status, setStatus] = useState<{ paid_slots: number; registered_students_count: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("Guru");

  useEffect(() => {
    setDisplayName(getAuthUserName() ?? "Guru");
  }, []);

  useEffect(() => {
    getTrainerStatus()
      .then((s) => setStatus(s))
      .catch((e) => setError(getFriendlyApiErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  const slotsAvailable = status ? Math.max(0, status.paid_slots - status.registered_students_count) : 0;

  const cards = [
    { label: "Slot dibayar", value: status?.paid_slots ?? "–", href: "/guru/kelola-siswa", color: "sky" },
    { label: "Siswa terdaftar", value: status?.registered_students_count ?? "–", href: "/guru/kelola-siswa", color: "emerald" },
    { label: "Slot tersedia", value: slotsAvailable, href: "/guru/kelola-siswa", color: "amber" },
  ];

  if (error) {
    return (
      <main className="flex flex-1 flex-col px-4 py-6 sm:px-6 md:px-8 md:py-8">
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6 text-center">
          <p className="text-base font-medium text-amber-900">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
          >
            Coba lagi
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col px-4 py-6 sm:px-6 md:px-8 md:py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 md:mb-8">
        <div>
          <p className="text-sm font-medium text-zinc-500">
            Halo, {displayName}
          </p>
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-zinc-900">
            Dashboard Guru
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Kelola siswa, kelas, dan pantau aktivitas.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-sky-500" />
          Memuat...
        </div>
      ) : (
        <>
          <section className="mb-8">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Ringkasan
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map((c) => (
                <Link
                  key={c.label}
                  href={c.href}
                  className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-sky-200 hover:shadow-md"
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    {c.label}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-zinc-900">
                    {c.value}
                  </p>
                  <p className="mt-1 text-xs text-sky-600 group-hover:underline">
                    Kelola →
                  </p>
                </Link>
              ))}
            </div>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Akses cepat
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                href="/guru/kelola-siswa"
                className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-sky-200 hover:bg-sky-50/50"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                </span>
                <div>
                  <p className="font-medium text-zinc-900">Kelola Siswa</p>
                  <p className="text-xs text-zinc-500">Bayar slot & daftarkan siswa</p>
                </div>
              </Link>
              <Link
                href="/guru/kelola-kelas"
                className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-sky-200 hover:bg-sky-50/50"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                </span>
                <div>
                  <p className="font-medium text-zinc-900">Kelola Kelas</p>
                  <p className="text-xs text-zinc-500">Buat dan atur kelas</p>
                </div>
              </Link>
              <Link
                href="/guru/laporan"
                className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-sky-200 hover:bg-sky-50/50"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </span>
                <div>
                  <p className="font-medium text-zinc-900">Laporan</p>
                  <p className="text-xs text-zinc-500">Statistik & rekap</p>
                </div>
              </Link>
              <Link
                href="/guru/pembayaran"
                className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-sky-200 hover:bg-sky-50/50"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                </span>
                <div>
                  <p className="font-medium text-zinc-900">Riwayat Pembayaran</p>
                  <p className="text-xs text-zinc-500">Daftar transaksi</p>
                </div>
              </Link>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
