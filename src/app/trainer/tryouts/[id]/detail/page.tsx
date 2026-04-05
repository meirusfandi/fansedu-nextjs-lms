"use client";

import { TryoutAttemptReviewModal } from "@/components/tryout/TryoutAttemptReviewModal";
import {
  trainerGetTryout,
  trainerGetTryoutAttemptReview,
  trainerGetTryoutStudents,
  trainerPostTryoutAttemptAutoGrade,
  trainerPutTryoutAttemptAnswerReview,
  trainerPutTryoutAttemptReviewBatch,
} from "@/lib/api";
import type { AdminTryoutStudent, TryoutSession } from "@/lib/api-types";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export default function TrainerTryoutDetailPage() {
  const params = useParams();
  const tryoutId = params?.id as string | undefined;

  const [tryout, setTryout] = useState<TryoutSession | null>(null);
  const [students, setStudents] = useState<AdminTryoutStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewStudent, setReviewStudent] = useState<AdminTryoutStudent | null>(null);

  const tryoutReviewApi = useMemo(
    () => ({
      getAttemptReview: trainerGetTryoutAttemptReview,
      putAnswerReview: trainerPutTryoutAttemptAnswerReview,
      putReviewBatch: trainerPutTryoutAttemptReviewBatch,
      postAutoGrade: trainerPostTryoutAttemptAutoGrade,
    }),
    []
  );

  const loadData = useCallback(async () => {
    if (!tryoutId) return;
    setLoading(true);
    setError(null);
    try {
      const [t, s] = await Promise.all([
        trainerGetTryout(tryoutId),
        trainerGetTryoutStudents(tryoutId),
      ]);
      setTryout(t);
      setStudents(Array.isArray(s) ? s : []);
    } catch (e) {
      setError((e as Error).message ?? "Gagal memuat data");
      setTryout(null);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [tryoutId]);

  /** Setelah auto-grade / simpan review: refresh state saja (jangan setLoading — hindari konten hilang saat modal terbuka). */
  const refreshTrainerTryoutFromApi = useCallback(async () => {
    if (!tryoutId) return;
    try {
      const [t, s] = await Promise.all([
        trainerGetTryout(tryoutId).catch(() => null),
        trainerGetTryoutStudents(tryoutId).catch(() => []),
      ]);
      if (t != null) setTryout(t);
      setStudents(Array.isArray(s) ? s : []);
    } catch {
      /* pertahankan state */
    }
  }, [tryoutId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    setReviewStudent((prev) => {
      if (!prev?.attemptId) return prev;
      const aid = String(prev.attemptId).trim();
      const updated = students.find(
        (s) => s.attemptId != null && String(s.attemptId).trim() === aid
      );
      return updated ?? prev;
    });
  }, [students]);

  if (!tryoutId) {
    return (
      <div className="px-4 py-8">
        <p className="text-sm text-zinc-500">ID tryout tidak valid.</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-5 sm:px-6 md:px-8 md:py-8">
      <Link href="/trainer/tryouts" className="text-sm text-zinc-600 underline hover:text-zinc-900">
        ← Tryout
      </Link>
      <h1 className="mt-2 text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
        Review tryout
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        {tryout?.title ?? tryout?.shortTitle ?? tryoutId}
      </p>
      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      {loading ? (
        <p className="mt-6 text-sm text-zinc-500">Memuat...</p>
      ) : (
        <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Siswa (submit)
          </h2>
          {students.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-500">Belum ada data siswa atau daftar submit belum tersedia.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-zinc-500">Nama</th>
                    <th className="px-4 py-2 text-left font-medium text-zinc-500">Email</th>
                    <th className="px-4 py-2 text-left font-medium text-zinc-500">Submit</th>
                    <th className="px-4 py-2 text-right font-medium text-zinc-500">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {students.map((s) => (
                    <tr key={s.attemptId ?? s.id ?? `${s.email}-${s.submittedAt}`} className="hover:bg-zinc-50/50">
                      <td className="px-4 py-2 text-zinc-800">{s.name ?? "–"}</td>
                      <td className="px-4 py-2 text-zinc-600">{s.email ?? "–"}</td>
                      <td className="px-4 py-2 text-zinc-600">
                        {s.submittedAt ? formatDate(s.submittedAt) : "–"}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button
                          type="button"
                          disabled={!s.attemptId}
                          onClick={() => setReviewStudent(s)}
                          className="rounded border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
                        >
                          Review jawaban
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {reviewStudent && tryoutId && (
        <TryoutAttemptReviewModal
          tryoutId={tryoutId}
          student={reviewStudent}
          onClose={() => setReviewStudent(null)}
          onSaved={refreshTrainerTryoutFromApi}
          api={tryoutReviewApi}
        />
      )}
    </div>
  );
}
