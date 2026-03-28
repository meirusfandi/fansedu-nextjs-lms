"use client";

import Link from "next/link";

export default function GuruKelolaKelasPage() {
  return (
    <main className="flex flex-1 flex-col px-4 py-6 sm:px-6 md:px-8 md:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Kelola Kelas</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Sinkron dengan kelas yang disiapkan admin. Trainer/pengajar bisa mengelola detail konten dari workspace kelas.
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-zinc-600">
          Gunakan menu berikut untuk mengelola kelas Anda:
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/trainer/classes"
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
          >
            Buka Kelas Saya
          </Link>
          <Link
            href="/trainer/classes/create"
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Buat Kelas Baru
          </Link>
        </div>
      </div>
    </main>
  );
}
