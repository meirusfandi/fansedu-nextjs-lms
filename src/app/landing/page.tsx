"use client";

import Link from "next/link";

const LANDING_URL = process.env.NEXT_PUBLIC_LANDING_URL || "#";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white">
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
          Fansedu LMS
        </h1>
        <p className="mt-4 text-zinc-600">
          Aplikasi web ini untuk <strong className="text-zinc-800">Admin</strong> dan{" "}
          <strong className="text-zinc-800">Trainer</strong> (pengajar). Masuk melalui halaman login untuk mengelola
          platform.
        </p>
        {LANDING_URL !== "#" ? (
          <a
            href={LANDING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-block rounded-lg bg-emerald-600 px-6 py-3 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Situs publik / informasi →
          </a>
        ) : (
          <p className="mt-6 text-sm text-zinc-500">
            Atur <code className="rounded bg-zinc-200 px-1.5 py-0.5">NEXT_PUBLIC_LANDING_URL</code> di .env untuk link
            eksternal opsional.
          </p>
        )}
        <p className="mt-8 text-sm text-zinc-500">
          <Link href="/login" className="font-medium text-zinc-800 underline-offset-2 hover:underline">
            Masuk sebagai Admin atau Trainer
          </Link>
        </p>
      </div>
    </div>
  );
}
