"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  getTryout,
  startTryout,
  getAttemptQuestions,
  putAttemptAnswer,
  submitAttempt,
} from "@/lib/api";
import type { Question as ApiQuestion, TryoutSession } from "@/lib/api-types";
import type { AttemptFeedback } from "@/lib/api-types";

type TryoutStatus = "loading" | "intro" | "in_progress" | "submitted";

type AnswerState = {
  text: string;
  selectedOption?: string;
  marked: boolean;
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function levelLabel(level: string): string {
  const map: Record<string, string> = {
    easy: "Mudah",
    medium: "Menengah",
    hard: "Sulit",
  };
  return map[level] ?? level;
}

export default function TryoutDetailPage() {
  const params = useParams<{ id: string }>();
  const tryoutId = params.id as string;

  const [tryout, setTryout] = useState<TryoutSession | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [status, setStatus] = useState<TryoutStatus>("loading");
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<ApiQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    score: number;
    percentile: number;
    feedback: AttemptFeedback;
  } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    getTryout(tryoutId)
      .then(setTryout)
      .catch(() => setLoadError("Tryout tidak ditemukan"))
      .finally(() => setStatus((s) => (s === "loading" ? "intro" : s)));
  }, [tryoutId]);

  const totalQuestions = questions.length;
  const question = questions[currentIndex];
  const currentAnswer = question
    ? answers[question.id] ?? { text: "", marked: false }
    : { text: "", marked: false };

  const isAnswered = useCallback(
    (a: AnswerState) =>
      (a.text?.trim() ?? "") !== "" || (a.selectedOption ?? "") !== "",
    []
  );
  const answeredCount = useMemo(
    () =>
      questions.filter((q) =>
        isAnswered(answers[q.id] ?? { text: "", marked: false })
      ).length,
    [questions, answers, isAnswered]
  );
  const markedCount = useMemo(
    () => Object.values(answers).filter((a) => a.marked).length,
    [answers]
  );

  const saveCurrentAnswer = useCallback(
    (updates: Partial<AnswerState>) => {
      if (!question) return;
      const next = {
        ...currentAnswer,
        ...updates,
      };
      setAnswers((prev) => ({ ...prev, [question.id]: next }));
      putAttemptAnswer(attemptId!, question.id, {
        answer_text: next.text || undefined,
        selected_option: next.selectedOption || undefined,
        is_marked: next.marked,
      }).catch(() => {});
    },
    [attemptId, question, currentAnswer]
  );

  const startTryoutFlow = useCallback(async () => {
    if (!tryout) return;
    try {
      const { attempt_id, time_left_seconds } = await startTryout(tryout.id);
      const qs = await getAttemptQuestions(attempt_id);
      setAttemptId(attempt_id);
      setQuestions(qs);
      setTimeLeftSeconds(time_left_seconds);
      setCurrentIndex(0);
      setStatus("in_progress");
    } catch (e) {
      setLoadError((e as Error).message ?? "Gagal memulai simulasi");
    }
  }, [tryout]);

  useEffect(() => {
    if (status !== "in_progress" || timeLeftSeconds <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          if (attemptId) {
            submitAttempt(attemptId)
              .then((res) =>
                setSubmitResult({
                  score: res.score,
                  percentile: res.percentile,
                  feedback: res.feedback ?? {},
                })
              )
              .catch(() => setLoadError("Gagal mengirim jawaban"));
          }
          setStatus("submitted");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, attemptId]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  }, [currentIndex]);

  const goNext = useCallback(() => {
    if (currentIndex < totalQuestions - 1) setCurrentIndex((i) => i + 1);
  }, [currentIndex, totalQuestions]);

  const handleSubmit = useCallback(async () => {
    setShowConfirmSubmit(false);
    if (!attemptId) return;
    try {
      const res = await submitAttempt(attemptId);
      setSubmitResult({
        score: res.score,
        percentile: res.percentile,
        feedback: res.feedback ?? {},
      });
      setStatus("submitted");
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    } catch {
      setLoadError("Gagal mengirim jawaban");
    }
  }, [attemptId]);

  if (loadError || (!tryout && status !== "loading")) {
    if (loadError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-black">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-sm text-zinc-700 dark:text-zinc-200">
              {loadError}
            </p>
            <Link
              href="/student"
              className="mt-4 inline-block text-sm font-medium text-zinc-600 underline dark:text-zinc-400"
            >
              Kembali ke dashboard
            </Link>
          </div>
        </div>
      );
    }
    notFound();
  }

  if (status === "loading" || !tryout) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-sm text-zinc-500">Memuat...</p>
      </div>
    );
  }

  if (status === "intro") {
    return (
      <div className="flex min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
        <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 md:px-8">
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            <Link
              href="/student"
              className="font-medium text-zinc-700 underline-offset-2 hover:underline dark:text-zinc-300"
            >
              Dashboard siswa
            </Link>{" "}
            / Simulasi OSN Informatika
          </p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
            {tryout.title}
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {tryout.description ?? ""}
          </p>
          <section className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                Durasi
              </p>
              <p className="mt-1 font-semibold">{tryout.duration_minutes} menit</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                Jumlah soal
              </p>
              <p className="mt-1 font-semibold">{tryout.questions_count} soal</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                Tingkat
              </p>
              <p className="mt-1 font-semibold">
                {levelLabel(tryout.level)}
              </p>
            </div>
          </section>
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-900/50 dark:bg-amber-950/30">
            <h2 className="font-semibold text-amber-900 dark:text-amber-100">
              Tata tertib simulasi
            </h2>
            <ul className="mt-2 list-inside list-disc space-y-1 text-amber-800 dark:text-amber-200">
              <li>Timer berjalan setelah kamu klik &quot;Mulai simulasi&quot;.</li>
              <li>Jawaban disimpan otomatis.</li>
              <li>Waktu habis atau kirim jawaban akan mengakhiri simulasi.</li>
            </ul>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
            <Link
              href="/student"
              className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Batal
            </Link>
            <button
              type="button"
              onClick={startTryoutFlow}
              className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-zinc-50 shadow-sm hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Mulai simulasi
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (status === "submitted" && submitResult) {
    const { score, percentile, feedback } = submitResult;
    return (
      <div className="flex min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
        <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 md:px-8">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Simulasi selesai
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {tryout.title}
          </p>
          <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-around">
              <div className="text-center">
                <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Skor
                </p>
                <p className="mt-1 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                  {score}
                </p>
                <p className="text-xs text-zinc-500">/ 100</p>
              </div>
              <div className="text-center">
                <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Persentil
                </p>
                <p className="mt-1 text-2xl font-semibold">{percentile}%</p>
              </div>
              <div className="text-center">
                <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Soal terjawab
                </p>
                <p className="mt-1 text-2xl font-semibold">
                  {answeredCount} / {totalQuestions}
                </p>
              </div>
            </div>
            {feedback.summary && (
              <p className="mt-4 text-center text-xs text-zinc-600 dark:text-zinc-400">
                {feedback.summary}
              </p>
            )}
            {feedback.recommendation_text && (
              <p className="mt-2 text-center text-xs text-zinc-600 dark:text-zinc-400">
                {feedback.recommendation_text}
              </p>
            )}
          </section>
          <div className="mt-8 flex justify-center">
            <Link
              href="/student"
              className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-zinc-50 shadow-sm hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Kembali ke dashboard siswa
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (status === "submitted" && !submitResult) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-sm text-zinc-500">Mengirim jawaban...</p>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-sm text-zinc-500">Memuat soal...</p>
      </div>
    );
  }

  const options = question.options ?? [];
  const optionKeys = ["A", "B", "C", "D"].slice(0, options.length);

  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto w-full max-w-5xl px-4 py-4 sm:px-6 md:px-8 md:py-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <Link
              href="/student"
              className="text-[11px] font-medium text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
            >
              Dashboard
            </Link>
            <span className="text-[11px] text-zinc-400">|</span>
            <span className="text-xs font-medium">{tryout.title}</span>
          </div>
          <div
            className={`rounded-full px-3 py-1.5 text-sm font-mono font-semibold ${
              timeLeftSeconds <= 300
                ? "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300"
                : "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
            }`}
          >
            {formatTime(timeLeftSeconds)}
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-[minmax(0,180px)_1fr]">
          <aside className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Soal
            </p>
            <div className="grid grid-cols-4 gap-2">
              {questions.map((q, i) => {
                const a = answers[q.id];
                const answered = isAnswered(a ?? { text: "", marked: false });
                const marked = a?.marked;
                const isCurrent = i === currentIndex;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIndex(i)}
                    className={`flex h-11 w-full min-w-[2.25rem] items-center justify-center rounded-lg text-sm font-medium transition ${
                      isCurrent
                        ? "border-2 border-zinc-900 bg-zinc-900 text-zinc-50 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                        : marked
                          ? "border border-amber-400 bg-amber-50 text-amber-800 dark:border-amber-600 dark:bg-amber-950/50 dark:text-amber-200"
                          : answered
                            ? "border border-emerald-400 bg-emerald-50 text-emerald-800 dark:border-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-200"
                            : "border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-100">
              Soal #{currentIndex + 1} — {question.type === "short" ? "Isian singkat" : question.type === "multiple_choice" ? "Pilihan ganda" : "Benar/Salah"}
            </p>
            <p className="mt-3 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-200">
              {question.body}
            </p>

            <div className="mt-4 space-y-2">
              {question.type === "short" && (
                <>
                  <label
                    htmlFor="answer-input"
                    className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-200"
                  >
                    Isian singkat
                  </label>
                  <input
                    id="answer-input"
                    type="text"
                    value={currentAnswer.text}
                    onChange={(e) =>
                      saveCurrentAnswer({ text: e.target.value })
                    }
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-500 focus:border-zinc-900 focus:bg-white focus:text-zinc-900 focus:ring-2 focus:ring-zinc-900/5 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-400 dark:focus:border-zinc-200 dark:focus:bg-zinc-800 dark:focus:text-zinc-50"
                    placeholder="Ketik jawaban..."
                  />
                </>
              )}
              {question.type === "multiple_choice" && (
                <>
                  <p className="text-[11px] font-medium text-zinc-700 dark:text-zinc-200">
                    Pilihan ganda
                  </p>
                  <div className="mt-2 space-y-2">
                    {options.map((opt, idx) => {
                      const key = optionKeys[idx];
                      const isSelected = currentAnswer.selectedOption === key;
                      return (
                        <label
                          key={opt}
                          className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                            isSelected
                              ? "border-zinc-900 bg-zinc-100 dark:border-zinc-100 dark:bg-zinc-800"
                              : "border-zinc-200 bg-zinc-50 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q-${question.id}`}
                            checked={isSelected}
                            onChange={() =>
                              saveCurrentAnswer({ selectedOption: key })
                            }
                            className="h-4 w-4"
                          />
                          <span className="font-medium">{key}.</span>
                          <span>{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                </>
              )}
              {question.type === "true_false" && (
                <>
                  <p className="text-[11px] font-medium text-zinc-700 dark:text-zinc-200">
                    Benar / Salah
                  </p>
                  <div className="mt-2 flex gap-3">
                    {(["Benar", "Salah"] as const).map((opt) => {
                      const isSelected = currentAnswer.selectedOption === opt;
                      return (
                        <label
                          key={opt}
                          className={`flex cursor-pointer items-center gap-2 rounded-xl border px-5 py-3 text-sm font-medium transition ${
                            isSelected
                              ? "border-zinc-900 bg-zinc-100 dark:border-zinc-100 dark:bg-zinc-800"
                              : "border-zinc-200 bg-zinc-50 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`tf-${question.id}`}
                            checked={isSelected}
                            onChange={() =>
                              saveCurrentAnswer({ selectedOption: opt })
                            }
                            className="h-4 w-4"
                          />
                          {opt}
                        </label>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() =>
                  saveCurrentAnswer({ marked: !currentAnswer.marked })
                }
                className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition ${
                  currentAnswer.marked
                    ? "border-amber-400 bg-amber-50 text-amber-800 dark:border-amber-600 dark:bg-amber-950/50 dark:text-amber-200"
                    : "border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                {currentAnswer.marked ? "✓ Ditandai" : "Tandai untuk ditinjau"}
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={goPrev}
                  disabled={currentIndex === 0}
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Sebelumnya
                </button>
                {currentIndex < totalQuestions - 1 ? (
                  <button
                    type="button"
                    onClick={goNext}
                    className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  >
                    Berikutnya
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowConfirmSubmit(true)}
                    className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  >
                    Selesai & kirim
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="mt-4 flex justify-end border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setShowConfirmSubmit(true)}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            Selesai & kirim jawaban
          </button>
        </div>
      </main>

      {showConfirmSubmit && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-5 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Kirim jawaban?
            </h3>
            <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
              Setelah dikirim, jawaban tidak dapat diubah.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmSubmit(false)}
                className="flex-1 rounded-lg border border-zinc-200 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="flex-1 rounded-lg bg-zinc-900 py-2 text-sm font-semibold text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Kirim
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
