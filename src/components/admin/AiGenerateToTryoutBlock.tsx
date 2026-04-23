"use client";

import { generateAndPersistAiQuestions } from "@/lib/ai-question-persist";
import type { QuestionBankImportContext } from "@/lib/question-bank-client";
import { useState } from "react";

const defaultForm = {
  subject: "Matematika",
  grade: "SMP",
  topic: "Aljabar",
  difficulty: "medium",
  count: 3,
};

export function AiGenerateToTryoutBlock({
  tryoutId,
  tryoutHint,
  importCtx,
  syncToBankDefault = true,
  onDone,
}: {
  tryoutId: string;
  /** Teks bantuan (mis. judul tryout). */
  tryoutHint?: string;
  importCtx?: QuestionBankImportContext | null;
  syncToBankDefault?: boolean;
  onDone?: (message: string) => void;
}) {
  const [subject, setSubject] = useState(defaultForm.subject);
  const [grade, setGrade] = useState(defaultForm.grade);
  const [topic, setTopic] = useState(defaultForm.topic);
  const [difficulty, setDifficulty] = useState(defaultForm.difficulty);
  const [count, setCount] = useState(defaultForm.count);
  const [syncToBank, setSyncToBank] = useState(syncToBankDefault);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMsg, setLastMsg] = useState<string | null>(null);

  const disabled = loading || !tryoutId.trim();

  const submit = async () => {
    setError(null);
    setLastMsg(null);
    setLoading(true);
    try {
      const n = Math.min(20, Math.max(1, Math.floor(Number(count)) || 1));
      const r = await generateAndPersistAiQuestions({
        tryoutId: tryoutId.trim(),
        request: {
          subject: subject.trim() || "Umum",
          grade: grade.trim() || "Umum",
          topic: topic.trim() || "Umum",
          difficulty: difficulty.trim() || "medium",
          count: n,
        },
        importCtx: importCtx ?? null,
        syncToBank,
      });
      const msg =
        r.created === 0
          ? "Tidak ada soal yang dikembalikan AI."
          : syncToBank
            ? `Berhasil: ${r.created} soal ditambahkan ke tryout; bank soal +${r.bankAdded} baru, ${r.bankSkipped} duplikat dilewati.`
            : `Berhasil: ${r.created} soal ditambahkan ke tryout (tanpa sinkron bank).`;
      setLastMsg(msg);
      onDone?.(msg);
    } catch (e) {
      setError((e as Error)?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-4 text-zinc-900">
      <p className="text-sm font-semibold text-violet-950">Generate soal (AI)</p>
      {tryoutHint ? (
        <p className="mt-1 text-xs text-violet-900/80">
          Tryout: <span className="font-medium">{tryoutHint}</span>
        </p>
      ) : null}
      <p className="mt-2 text-xs text-zinc-600">
        Memanggil layanan <code className="rounded bg-white/80 px-1">/generate-questions</code>, lalu menyimpan ke
        tryout sebagai soal baru. Opsional: salin snapshot ke bank soal lokal.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-xs font-medium text-zinc-700">
          Mata pelajaran
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-0.5 w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm"
          />
        </label>
        <label className="text-xs font-medium text-zinc-700">
          Jenjang / kelas
          <input
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="mt-0.5 w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm"
          />
        </label>
        <label className="text-xs font-medium text-zinc-700">
          Topik
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="mt-0.5 w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm"
          />
        </label>
        <label className="text-xs font-medium text-zinc-700">
          Kesulitan
          <input
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            placeholder="easy | medium | hard"
            className="mt-0.5 w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm"
          />
        </label>
        <label className="text-xs font-medium text-zinc-700">
          Jumlah
          <input
            type="number"
            min={1}
            max={20}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="mt-0.5 w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm"
          />
        </label>
      </div>
      <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs text-zinc-700">
        <input
          type="checkbox"
          checked={syncToBank}
          onChange={(e) => setSyncToBank(e.target.checked)}
          className="h-4 w-4 rounded border-zinc-400 accent-zinc-900"
        />
        Simpan salinan ke bank soal (file JSON server)
      </label>
      {error ? (
        <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-800">{error}</div>
      ) : null}
      {lastMsg ? (
        <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-xs text-emerald-900">
          {lastMsg}
        </div>
      ) : null}
      <button
        type="button"
        disabled={disabled}
        onClick={() => void submit()}
        className="mt-3 rounded-lg bg-violet-800 px-4 py-2 text-sm font-medium text-white hover:bg-violet-900 disabled:opacity-50"
      >
        {loading ? "Menghasilkan…" : "Generate & simpan ke tryout"}
      </button>
    </div>
  );
}
