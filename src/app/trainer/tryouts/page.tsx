"use client";

import { trainerListTryouts } from "@/lib/api";
import type { TryoutSession } from "@/lib/api-types";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  open: "Dibuka",
  closed: "Ditutup",
};

export default function TrainerTryoutsPage() {
  const [list, setList] = useState<TryoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await trainerListTryouts();
      setList(Array.isArray(raw) ? raw : []);
    } catch (e) {
      setError((e as Error).message ?? "Gagal memuat tryout.");
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="px-4 py-5 sm:px-6 md:px-8 md:py-8">
      <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">Tryout</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Review jawaban siswa untuk tryout yang terkait mapel Anda. Pastikan endpoint GET{" "}
        <code className="rounded bg-zinc-100 px-1 text-xs">/trainer/tryouts</code> aktif di backend.
      </p>
      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      {loading ? (
        <p className="mt-6 text-sm text-zinc-500">Memuat...</p>
      ) : list.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-500">Tidak ada tryout atau daftar belum tersedia dari API.</p>
      ) : (
        <ul className="mt-6 divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
          {list.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <div>
                <p className="font-medium text-zinc-900">{t.title ?? t.shortTitle ?? t.id}</p>
                <p className="text-xs text-zinc-500">
                  {STATUS_LABEL[String(t.status)] ?? t.status} · {t.id}
                </p>
              </div>
              <Link
                href={`/trainer/tryouts/${t.id}/detail`}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Detail & review
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
