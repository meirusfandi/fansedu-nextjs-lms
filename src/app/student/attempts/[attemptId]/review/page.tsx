"use client";

import { QuestionBody } from "@/components/QuestionBody";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getAttemptReview, getStudentAttemptDetail } from "@/lib/api";
import type { AttemptReviewItem } from "@/lib/api-types";

export default function AttemptReviewPage() {
  const params = useParams<{ attemptId: string }>();
  const attemptId = params.attemptId as string;
  const [items, setItems] = useState<AttemptReviewItem[]>([]);
  const [tryoutTitle, setTryoutTitle] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      getAttemptReview(attemptId),
      getStudentAttemptDetail(attemptId).catch(() => null),
    ])
      .then(([reviewList, attempt]) => {
        setItems(reviewList ?? []);
        if (attempt?.tryout_session_id) {
          setTryoutTitle((attempt as { tryout_title?: string }).tryout_title ?? "Simulasi");
        }
      })
      .catch(() => setError("Gagal memuat review"))
      .finally(() => setLoading(false));
  }, [attemptId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-sm text-zinc-500">Memuat soal & jawaban...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-black">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-700 dark:text-zinc-200">{error}</p>
          <Link href="/student" className="mt-4 inline-block text-sm font-medium text-zinc-600 underline dark:text-zinc-400">
            Kembali ke dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6 md:py-8">
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
          <Link href="/student" className="font-medium text-zinc-700 underline-offset-2 hover:underline dark:text-zinc-300">
            Dashboard siswa
          </Link>
          {" / "}
          <span>Soal & jawaban</span>
        </p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
          Review soal & jawaban
        </h1>
        {tryoutTitle && (
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{tryoutTitle}</p>
        )}
        <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
          Lihat jawaban Anda dan jawaban benar untuk setiap soal.
        </p>

        {items.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Belum ada data review. Backend dapat menyediakan <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">GET /attempts/:attemptId/review</code> atau <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">GET /student/attempts/:attemptId/review</code>.
            </p>
          </div>
        ) : (
          <ul className="mt-6 space-y-4">
            {items.map((q, idx) => {
              const isCorrect = q.is_correct === true;
              const userAns = q.user_answer ?? "–";
              const correctAns = q.correct_answer ?? "–";
              return (
                <li
                  key={q.question_id}
                  className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                      Soal #{(q.sort_order ?? idx) + 1}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                        isCorrect
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                          : "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300"
                      }`}
                    >
                      {isCorrect ? "Benar" : "Salah"}
                    </span>
                  </div>
                  <div className="mt-2">
                    <QuestionBody html={q.body ?? ""} imageUrl={q.image_url} />
                  </div>
                  <div className="mt-3 grid gap-2 text-xs">
                    <div className="flex flex-wrap gap-2">
                      <span className="font-medium text-zinc-500 dark:text-zinc-400">Jawaban Anda:</span>
                      <span className={isCorrect ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}>
                        {userAns}
                      </span>
                    </div>
                    {!isCorrect && correctAns !== "–" && (
                      <div className="flex flex-wrap gap-2">
                        <span className="font-medium text-zinc-500 dark:text-zinc-400">Jawaban benar:</span>
                        <span className="text-emerald-700 dark:text-emerald-300">{correctAns}</span>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-8 flex justify-center">
          <Link
            href="/student"
            className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Kembali ke dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
