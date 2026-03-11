"use client";

import Link from "next/link";

const LANDING_URL = process.env.NEXT_PUBLIC_LANDING_URL || "#";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white">
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
          Platform Belajar Siswa & Guru
        </h1>
        <p className="mt-4 text-zinc-600">
          Dashboard dan fitur belajar untuk siswa serta guru tersedia di platform terpisah.
          Silakan akses melalui link di bawah.
        </p>
        {LANDING_URL !== "#" ? (
          <a
            href={LANDING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-block rounded-lg bg-emerald-600 px-6 py-3 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Buka platform belajar →
          </a>
        ) : (
          <p className="mt-6 text-sm text-zinc-500">
            Atur <code className="rounded bg-zinc-200 px-1.5 py-0.5">NEXT_PUBLIC_LANDING_URL</code> di .env untuk menambahkan link.
          </p>
        )}
        <p className="mt-8 text-sm text-zinc-500">
          Jika Anda admin atau trainer/guru, gunakan menu di atas untuk masuk ke dashboard.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-block text-sm font-medium text-zinc-700 hover:text-zinc-900"
        >
          ← Kembali ke login
        </Link>
      </div>
    </div>
  );
}
