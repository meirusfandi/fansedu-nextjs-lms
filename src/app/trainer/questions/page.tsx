"use client";

import { QuestionBody } from "@/components/QuestionBody";
import { fetchQuestionBank } from "@/lib/question-bank-client";
import { getFriendlyApiErrorMessage } from "@/lib/api";
import type { QuestionBankEntry } from "@/lib/question-bank/types";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

function typeLabel(t: string): string {
  if (t === "multiple_choice") return "Pilihan ganda";
  if (t === "true_false") return "Benar/salah";
  return "Isian";
}

export default function TrainerQuestionBankReadPage() {
  const [entries, setEntries] = useState<QuestionBankEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchQuestionBank();
      setEntries(list.sort((a, b) => b.importedAt.localeCompare(a.importedAt)));
    } catch (e) {
      setError(getFriendlyApiErrorMessage(e));
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="px-4 py-5 text-zinc-900 [color-scheme:light] sm:px-6 md:px-8 md:py-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Trainer</p>
      <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">Bank soal</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Tampilan baca saja. Untuk menambah atau menghapus soal di bank, gunakan akun{" "}
        <Link href="/admin/question-bank" className="font-medium text-emerald-700 underline">
          admin → Bank soal
        </Link>{" "}
        (impor dari tryout).
      </p>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <p className="mt-6 text-sm text-zinc-500">Memuat…</p>
      ) : entries.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-500">Bank soal masih kosong atau belum ada yang diimpor dari tryout.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {entries.map((e) => (
            <li key={e.id} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                <span className="rounded bg-zinc-100 px-2 py-0.5 font-medium text-zinc-700">
                  {typeLabel(e.type)}
                </span>
                <span>Skor maks: {e.maxScore}</span>
                {e.sourceTryoutTitle && <span>· {e.sourceTryoutTitle}</span>}
              </div>
              <div className="mt-2">
                <QuestionBody html={e.body} imageUrl={e.imageUrl} asPreview />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
