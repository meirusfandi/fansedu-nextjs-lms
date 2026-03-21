"use client";

import Link from "next/link";
import { useTrainerStatus } from "@/hooks/useDashboardQueries";
import { getFriendlyApiErrorMessage } from "@/lib/api";
import { CardStats } from "@/components/ui/CardStats";

export default function TrainerDashboardPage() {
  const { data: status, isLoading, error } = useTrainerStatus();
  const slotsAvailable = status ? Math.max(0, status.paid_slots - status.registered_students_count) : 0;

  if (error) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6 text-center">
        <p className="text-base font-medium text-amber-900">{getFriendlyApiErrorMessage(error)}</p>
        <button type="button" onClick={() => window.location.reload()} className="mt-4 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700">
          Coba lagi
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Overview</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900">Trainer Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">Kelola kelas, bank soal, dan kuis.</p>
      </div>

      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <CardStats title="Slot dibayar" value={isLoading ? "..." : (status?.paid_slots ?? "–")} subtitle="Untuk mendaftarkan siswa" />
        <CardStats title="Siswa terdaftar" value={isLoading ? "..." : (status?.registered_students_count ?? "–")} subtitle="Siswa yang sudah didaftarkan" />
        <CardStats title="Slot tersedia" value={isLoading ? "..." : slotsAvailable} subtitle="Sisa slot untuk siswa baru" />
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">Akses cepat</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/trainer/classes" className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-sky-200 hover:bg-sky-50/50">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </span>
            <div>
              <p className="font-medium text-zinc-900">Kelas</p>
              <p className="text-xs text-zinc-500">Buat dan atur kelas</p>
            </div>
          </Link>
          <Link href="/trainer/classes/create" className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-sky-200 hover:bg-sky-50/50">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </span>
            <div>
              <p className="font-medium text-zinc-900">Buat kelas</p>
              <p className="text-xs text-zinc-500">Buat kelas baru</p>
            </div>
          </Link>
          <Link href="/trainer/questions" className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-sky-200 hover:bg-sky-50/50">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </span>
            <div>
              <p className="font-medium text-zinc-900">Bank soal</p>
              <p className="text-xs text-zinc-500">Kelola soal</p>
            </div>
          </Link>
          <Link href="/trainer/quizzes" className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-sky-200 hover:bg-sky-50/50">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </span>
            <div>
              <p className="font-medium text-zinc-900">Kuis</p>
              <p className="text-xs text-zinc-500">Buat kuis</p>
            </div>
          </Link>
        </div>
      </section>

      <p className="mt-6 text-sm text-zinc-500">
        Kelola peserta dan pembayaran slot:{" "}
        <Link href="/guru/kelola-siswa" className="font-medium text-sky-600 hover:underline">
          Kelola peserta
        </Link>{" "}
        ·{" "}
        <Link href="/guru/pembayaran" className="font-medium text-sky-600 hover:underline">
          Pembayaran
        </Link>
        .
      </p>
    </>
  );
}
