"use client";

import Link from "next/link";
import { useTrainerCourses } from "@/hooks/useDashboardQueries";
import { getFriendlyApiErrorMessage } from "@/lib/api";

export default function TrainerClassesPage() {
  const { data: courses = [], isLoading, error } = useTrainerCourses();

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
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Kelas Saya</h1>
          <p className="mt-1 text-sm text-zinc-500">Daftar kelas (integrasi GET /trainer/courses).</p>
        </div>
        <Link
          href="/trainer/classes/create"
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
        >
          Buat kelas
        </Link>
      </div>

      {isLoading ? (
        <div className="mt-6 flex items-center gap-2 text-sm text-zinc-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-sky-300 border-t-sky-600" />
          Memuat...
        </div>
      ) : courses.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 px-4 py-8 text-center">
          <p className="text-sm text-zinc-600">Belum ada kelas.</p>
          <Link href="/trainer/classes/create" className="mt-3 inline-block text-sm font-medium text-sky-600 hover:underline">
            Buat kelas pertama →
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <Link
              key={c.id}
              href={`/trainer/classes/${c.id}`}
              className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-sky-200 hover:shadow-md"
            >
              <h2 className="font-medium text-zinc-900">{c.title}</h2>
              {c.description && <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{c.description}</p>}
              <span className="mt-2 inline-block text-xs font-medium text-sky-600">Lihat detail →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
