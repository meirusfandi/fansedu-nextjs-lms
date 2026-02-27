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

const tryoutConfigs = [
  {
    id: "to-1",
    title: "Simulasi OSN Informatika - Tingkat Kabupaten",
    level: "Menengah",
    duration: "90 menit",
    durationMinutes: 90,
    questions: 20,
    description:
      "Simulasi komprehensif untuk mengukur kesiapan dasar mengikuti OSN Informatika tingkat kabupaten.",
  },
  {
    id: "to-2",
    title: "Simulasi OSN Informatika - Tingkat Provinsi",
    level: "Sulit",
    duration: "120 menit",
    durationMinutes: 120,
    questions: 25,
    description:
      "Simulasi dengan soal-soal algoritma dan struktur data tingkat lanjut sebagai persiapan OSN tingkat provinsi.",
  },
  {
    id: "to-3",
    title: "Latihan Cepat OSN Informatika - Pemanasan",
    level: "Mudah",
    duration: "45 menit",
    durationMinutes: 45,
    questions: 10,
    description:
      "Latihan singkat untuk pemanasan dan membiasakan diri dengan format soal OSN Informatika.",
  },
];

type TryoutStatus = "intro" | "in_progress" | "submitted";

type QuestionType = "short" | "multiple_choice" | "true_false";

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

// Tipe soal bergantian: isian singkat, pilihan ganda, benar/salah
const QUESTION_TYPES: QuestionType[] = ["short", "multiple_choice", "true_false"];

// Placeholder soal per nomor (bisa diganti dari API nanti)
function getPlaceholderQuestion(index: number, total: number): {
  title: string;
  body: string;
  type: QuestionType;
  options?: string[];
} {
  const topics = [
    "Algoritma & kompleksitas waktu",
    "Struktur data (array, stack, queue)",
    "Pencarian & pengurutan",
    "Rekursi & divide-conquer",
    "Dynamic programming dasar",
    "Graf & traversal",
    "Matematika diskret",
    "String & pattern matching",
  ];
  const topic = topics[index % topics.length];
  const type = QUESTION_TYPES[index % QUESTION_TYPES.length];

  if (type === "short") {
    return {
      type: "short",
      title: `Soal #${index + 1} — ${topic} (Isian singkat)`,
      body: `Berapa kompleksitas waktu algoritma yang menggunakan satu loop dari 1 sampai N dan di dalamnya ada operasi O(1)? Tuliskan jawaban dalam notasi Big-O (contoh: O(N)).`,
    };
  }
  if (type === "multiple_choice") {
    return {
      type: "multiple_choice",
      title: `Soal #${index + 1} — ${topic} (Pilihan ganda)`,
      body: `Untuk mencari elemen maksimum dalam array tak terurut berukuran N, kompleksitas waktu terbaik yang dapat dicapai adalah:`,
      options: [
        "O(1)",
        "O(log N)",
        "O(N)",
        "O(N log N)",
      ],
    };
  }
  return {
    type: "true_false",
    title: `Soal #${index + 1} — ${topic} (Benar/Salah)`,
    body: `Pernyataan: "Algoritma binary search hanya dapat diterapkan pada array yang sudah terurut secara ascending atau descending."`,
    options: ["Benar", "Salah"],
  };
}

export default function TryoutDetailPage() {
  const params = useParams<{ id: string }>();
  const tryout = tryoutConfigs.find((t) => t.id === params.id);
  const [status, setStatus] = useState<TryoutStatus>("intro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, AnswerState>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalQuestions = tryout?.questions ?? 0;
  const durationMinutes = tryout?.durationMinutes ?? 90;

  const startTryout = useCallback(() => {
    setStatus("in_progress");
    setTimeLeftSeconds(durationMinutes * 60);
  }, [durationMinutes]);

  useEffect(() => {
    if (status !== "in_progress" || timeLeftSeconds <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setStatus("submitted");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  const currentAnswer = answers[currentIndex] ?? {
    text: "",
    selectedOption: undefined,
    marked: false,
  };
  const isAnswered = useCallback(
    (a: AnswerState) =>
      (a.text?.trim() ?? "") !== "" || (a.selectedOption ?? "") !== "",
    []
  );
  const answeredCount = useMemo(
    () => Object.values(answers).filter(isAnswered).length,
    [answers, isAnswered]
  );
  const markedCount = useMemo(
    () => Object.values(answers).filter((a) => a.marked).length,
    [answers]
  );

  const saveCurrentAnswer = useCallback(
    (updates: Partial<AnswerState>) => {
      setAnswers((prev) => ({
        ...prev,
        [currentIndex]: { ...currentAnswer, ...updates },
      }));
    },
    [currentIndex, currentAnswer]
  );

  const toggleMarked = useCallback(() => {
    saveCurrentAnswer({ marked: !currentAnswer.marked });
  }, [currentAnswer.marked, saveCurrentAnswer]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  }, [currentIndex]);

  const goNext = useCallback(() => {
    if (currentIndex < totalQuestions - 1) setCurrentIndex((i) => i + 1);
  }, [currentIndex, totalQuestions]);

  const handleSubmit = useCallback(() => {
    setShowConfirmSubmit(false);
    setStatus("submitted");
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  if (!tryout) {
    notFound();
  }

  const question = getPlaceholderQuestion(currentIndex, totalQuestions);

  // ---------- Intro: sebelum mulai ----------
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
            {tryout.description}
          </p>

          <section className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                Durasi
              </p>
              <p className="mt-1 font-semibold">{tryout.duration}</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                Jumlah soal
              </p>
              <p className="mt-1 font-semibold">{tryout.questions} soal</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                Tingkat
              </p>
              <p className="mt-1 font-semibold">{tryout.level}</p>
            </div>
          </section>

          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-900/50 dark:bg-amber-950/30">
            <h2 className="font-semibold text-amber-900 dark:text-amber-100">
              Tata tertib simulasi
            </h2>
            <ul className="mt-2 list-inside list-disc space-y-1 text-amber-800 dark:text-amber-200">
              <li>Timer akan berjalan terus setelah kamu klik &quot;Mulai simulasi&quot;.</li>
              <li>Jawaban dapat disimpan sementara kapan saja.</li>
              <li>Gunakan &quot;Tandai untuk ditinjau&quot; untuk soal yang ingin kamu periksa lagi.</li>
              <li>Waktu habis atau kirim jawaban akan mengakhiri simulasi; jawaban tidak dapat diubah setelah itu.</li>
              <li>Pastikan koneksi internet stabil selama pengerjaan.</li>
            </ul>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
            <Link
              href="/student"
              className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Batal, kembali ke dashboard
            </Link>
            <button
              type="button"
              onClick={startTryout}
              className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-zinc-50 shadow-sm hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Mulai simulasi
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ---------- Hasil setelah submit / waktu habis ----------
  if (status === "submitted") {
    const mockScore = Math.min(
      100,
      Math.round((answeredCount / totalQuestions) * 85 + Math.random() * 15)
    );
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
                  Skor (contoh)
                </p>
                <p className="mt-1 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                  {mockScore}
                </p>
                <p className="text-xs text-zinc-500">/ 100</p>
              </div>
              <div className="text-center">
                <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Soal terjawab
                </p>
                <p className="mt-1 text-2xl font-semibold">
                  {answeredCount} / {totalQuestions}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Ditandai untuk ditinjau
                </p>
                <p className="mt-1 text-2xl font-semibold">{markedCount}</p>
              </div>
            </div>
            <p className="mt-6 text-center text-xs text-zinc-600 dark:text-zinc-400">
              Hasil dan rekomendasi belajar akan tersedia di dashboard siswa
              setelah diproses. (Integrasi backend untuk skor nyata dapat
              ditambahkan nanti.)
            </p>
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

  // ---------- Sedang mengerjakan ----------
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
          {/* Daftar nomor soal */}
          <aside className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Soal
            </p>
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: totalQuestions }).map((_, i) => {
                const a = answers[i];
                const answered = isAnswered(a ?? { text: "", marked: false });
                const marked = a?.marked;
                const isCurrent = i === currentIndex;
                return (
                  <button
                    key={i}
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
            <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-zinc-500 dark:text-zinc-400">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Terjawab
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                Ditandai
              </span>
            </div>
          </aside>

          {/* Soal + jawaban */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-100">
                {question.title}
              </p>
            </div>

            <p className="mb-4 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-200">
              {question.body}
            </p>

            <div className="space-y-2">
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
                    placeholder="Ketik jawaban singkat di sini..."
                  />
                </>
              )}
              {question.type === "multiple_choice" && (
                <>
                  <p className="text-[11px] font-medium text-zinc-700 dark:text-zinc-200">
                    Pilihan ganda — pilih satu jawaban:
                  </p>
                  <div className="mt-2 space-y-2">
                    {(question.options ?? []).map((opt, idx) => {
                      const optionKey = ["A", "B", "C", "D"][idx] ?? String(idx);
                      const isSelected =
                        currentAnswer.selectedOption === optionKey;
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
                            name={`soal-${currentIndex}`}
                            checked={isSelected}
                            onChange={() =>
                              saveCurrentAnswer({
                                selectedOption: optionKey,
                              })
                            }
                            className="h-4 w-4 border-zinc-300 text-zinc-900 focus:ring-zinc-900 dark:border-zinc-600 dark:bg-zinc-900"
                          />
                          <span className="font-medium text-zinc-700 dark:text-zinc-200">
                            {optionKey}.
                          </span>
                          <span className="text-zinc-700 dark:text-zinc-200">
                            {opt}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </>
              )}
              {question.type === "true_false" && (
                <>
                  <p className="text-[11px] font-medium text-zinc-700 dark:text-zinc-200">
                    Benar / Salah — pilih satu:
                  </p>
                  <div className="mt-2 flex flex-wrap gap-3">
                    {(["Benar", "Salah"] as const).map((opt) => {
                      const isSelected =
                        currentAnswer.selectedOption === opt;
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
                            name={`soal-tf-${currentIndex}`}
                            checked={isSelected}
                            onChange={() =>
                              saveCurrentAnswer({ selectedOption: opt })
                            }
                            className="h-4 w-4 border-zinc-300 text-zinc-900 focus:ring-zinc-900 dark:border-zinc-600 dark:bg-zinc-900"
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
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={toggleMarked}
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition ${
                    currentAnswer.marked
                      ? "border-amber-400 bg-amber-50 text-amber-800 dark:border-amber-600 dark:bg-amber-950/50 dark:text-amber-200"
                      : "border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  }`}
                >
                  {currentAnswer.marked ? "✓ Ditandai" : "Tandai untuk ditinjau"}
                </button>
              </div>
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

        {/* Bar bawah: kirim */}
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

      {/* Modal konfirmasi kirim */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-5 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Kirim jawaban?
            </h3>
            <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
              Setelah dikirim, kamu tidak dapat mengubah jawaban. Yakin ingin
              mengakhiri simulasi?
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
