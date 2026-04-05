"use client";

import { QuestionBankEntryModal } from "@/components/admin/QuestionBankEntryModal";
import { FlashNoticeBar, useFlashNotice } from "@/components/FlashNotice";
import { QuestionBody } from "@/components/QuestionBody";
import { Pagination, PAGE_SIZE } from "@/components/Pagination";
import {
  adminListTryoutQuestions,
  adminListTryouts,
  getFriendlyApiErrorMessage,
} from "@/lib/api";
import type { Question, TryoutSession } from "@/lib/api-types";
import {
  appendQuestionBankEntries,
  buildBankEntryFromQuestion,
  deleteQuestionBankEntry,
  fetchQuestionBank,
} from "@/lib/question-bank-client";
import type { QuestionBankEntry } from "@/lib/question-bank/types";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

function typeLabel(t: string): string {
  if (t === "multiple_choice") return "Pilihan ganda";
  if (t === "true_false") return "Benar/salah";
  return "Isian";
}

export default function AdminQuestionBankPage() {
  const { notice, showSuccess, clearNotice } = useFlashNotice();
  const [entries, setEntries] = useState<QuestionBankEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const [importOpen, setImportOpen] = useState(false);
  const [tryouts, setTryouts] = useState<TryoutSession[]>([]);
  const [tryoutsLoading, setTryoutsLoading] = useState(false);
  const [selectedTryoutId, setSelectedTryoutId] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [selectedQIds, setSelectedQIds] = useState<Set<string>>(new Set());
  const [importBusy, setImportBusy] = useState(false);
  const [importNotice, setImportNotice] = useState<string | null>(null);

  const [bankModalEntry, setBankModalEntry] = useState<QuestionBankEntry | null>(null);
  const [bankModalOpen, setBankModalOpen] = useState(false);

  const loadBank = useCallback(async () => {
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
    void loadBank();
  }, [loadBank]);

  const paginated = useMemo(
    () => entries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [entries, page]
  );

  useEffect(() => {
    if (entries.length > 0 && (page - 1) * PAGE_SIZE >= entries.length) {
      setPage(1);
    }
  }, [entries.length, page]);

  const openImport = async () => {
    setImportOpen(true);
    setImportNotice(null);
    setSelectedTryoutId("");
    setQuestions([]);
    setSelectedQIds(new Set());
    setTryoutsLoading(true);
    try {
      const list = await adminListTryouts();
      setTryouts(Array.isArray(list) ? list : []);
    } catch (e) {
      setImportNotice(getFriendlyApiErrorMessage(e));
      setTryouts([]);
    } finally {
      setTryoutsLoading(false);
    }
  };

  const loadQuestionsForTryout = async (tryoutId: string) => {
    if (!tryoutId) {
      setQuestions([]);
      setSelectedQIds(new Set());
      return;
    }
    setQuestionsLoading(true);
    setImportNotice(null);
    try {
      const list = await adminListTryoutQuestions(tryoutId);
      setQuestions(list);
      setSelectedQIds(new Set());
    } catch (e) {
      setImportNotice(getFriendlyApiErrorMessage(e));
      setQuestions([]);
    } finally {
      setQuestionsLoading(false);
    }
  };

  const selectedTryout = tryouts.find((t) => t.id === selectedTryoutId);

  const toggleQuestion = (qid: string) => {
    setSelectedQIds((prev) => {
      const next = new Set(prev);
      if (next.has(qid)) next.delete(qid);
      else next.add(qid);
      return next;
    });
  };

  const selectAllQuestions = () => {
    if (selectedQIds.size === questions.length) {
      setSelectedQIds(new Set());
    } else {
      setSelectedQIds(new Set(questions.map((q) => q.id)));
    }
  };

  const runImport = async () => {
    if (!selectedTryoutId || selectedQIds.size === 0) {
      setImportNotice("Pilih minimal satu soal.");
      return;
    }
    const title = selectedTryout?.title ?? "Tryout";
    const toAdd = questions
      .filter((q) => selectedQIds.has(q.id))
      .map((q) => buildBankEntryFromQuestion(q, selectedTryoutId, title));
    setImportBusy(true);
    setImportNotice(null);
    try {
      const r = await appendQuestionBankEntries(toAdd);
      const msg = `Berhasil: ${r.added} ditambahkan${r.skipped > 0 ? `, ${r.skipped} sudah ada di bank (dilewati)` : ""}.`;
      setImportNotice(msg);
      await loadBank();
      setSelectedQIds(new Set());
      showSuccess(msg);
    } catch (e) {
      setImportNotice(getFriendlyApiErrorMessage(e));
    } finally {
      setImportBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus soal ini dari bank?")) return;
    try {
      await deleteQuestionBankEntry(id);
      await loadBank();
      showSuccess("Soal berhasil dihapus dari bank.");
    } catch (e) {
      setError(getFriendlyApiErrorMessage(e));
    }
  };

  return (
    <div className="px-4 py-5 text-zinc-900 [color-scheme:light] sm:px-6 md:px-8 md:py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between md:mb-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Manage</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
            Bank soal
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-600">
            Kumpulan salinan soal dari tryout. Impor dari menu di bawah; data disimpan di{" "}
            <code className="rounded bg-zinc-100 px-1 text-xs">data/question-bank.json</code> (server). Untuk
            deployment read-only, nanti bisa dipindah ke API backend.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void openImport()}
          className="shrink-0 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Impor dari tryout
        </button>
      </div>

      {notice && (
        <div className="mb-4">
          <FlashNoticeBar kind={notice.kind} message={notice.text} onDismiss={clearNotice} />
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <p className="text-sm text-zinc-600">Memuat bank soal…</p>
      ) : entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/80 px-6 py-12 text-center">
          <p className="text-sm font-medium text-zinc-800">Bank masih kosong</p>
          <p className="mt-1 text-sm text-zinc-500">
            Klik <strong>Impor dari tryout</strong>, pilih event, lalu centang soal yang ingin dimasukkan.
          </p>
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {paginated.map((e) => (
              <li
                key={e.id}
                className="rounded-xl border border-zinc-200 bg-white p-4 text-zinc-900 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                  <div className="min-w-0 flex-1 text-zinc-900">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-600">
                      <span className="rounded bg-zinc-100 px-2 py-0.5 font-medium text-zinc-700">
                        {typeLabel(e.type)}
                      </span>
                      <span>Skor maks: {e.maxScore}</span>
                      {e.sourceTryoutTitle && (
                        <>
                          <span>·</span>
                          <Link
                            href={`/admin/tryouts/${e.sourceTryoutId}/soal`}
                            className="text-emerald-700 underline hover:text-emerald-900"
                          >
                            {e.sourceTryoutTitle}
                          </Link>
                        </>
                      )}
                    </div>
                    <div className="mt-2 text-zinc-900">
                      <QuestionBody html={e.body} imageUrl={e.imageUrl} asPreview />
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2 self-start sm:flex-row sm:items-center">
                    <button
                      type="button"
                      onClick={() => {
                        setBankModalEntry(e);
                        setBankModalOpen(true);
                      }}
                      className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
                    >
                      Detail & edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(e.id)}
                      className="text-sm text-red-600 underline hover:text-red-800"
                    >
                      Hapus dari bank
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {entries.length > PAGE_SIZE && (
            <div className="mt-6">
              <Pagination
                currentPage={page}
                totalItems={entries.length}
                onPageChange={setPage}
                label="soal"
              />
            </div>
          )}
        </>
      )}

      <QuestionBankEntryModal
        entry={bankModalEntry}
        open={bankModalOpen}
        onClose={() => {
          setBankModalOpen(false);
          setBankModalEntry(null);
        }}
        onSaved={() => {
          void loadBank();
          showSuccess("Perubahan soal berhasil disimpan.");
        }}
      />

      {importOpen && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-4 [color-scheme:light]">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-zinc-200 bg-white text-zinc-900 shadow-xl">
            <div className="flex items-start justify-between border-b border-zinc-100 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">Impor dari tryout</h2>
                <p className="mt-1 text-xs text-zinc-600">
                  Pilih tryout, lalu centang soal yang akan disalin ke bank (duplikat tryout+soal dilewati otomatis).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setImportOpen(false)}
                className="rounded-lg px-2 py-1 text-sm text-zinc-700 hover:bg-zinc-100"
                aria-label="Tutup"
              >
                ✕
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {importNotice && (
                <div
                  className={`mb-3 rounded-lg border px-3 py-2 text-sm ${
                    importNotice.startsWith("Berhasil")
                      ? "border-emerald-200 bg-emerald-50 text-emerald-950"
                      : "border-amber-200 bg-amber-50 text-amber-950"
                  }`}
                >
                  {importNotice}
                </div>
              )}

              <label className="mb-1 block text-xs font-medium text-zinc-800">Tryout / event</label>
              {tryoutsLoading ? (
                <p className="mt-2 text-sm text-zinc-600">Memuat daftar tryout…</p>
              ) : (
                <select
                  value={selectedTryoutId}
                  onChange={(ev) => {
                    const v = ev.target.value;
                    setSelectedTryoutId(v);
                    void loadQuestionsForTryout(v);
                  }}
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
                >
                  <option value="" className="text-zinc-900">
                    — Pilih tryout —
                  </option>
                  {tryouts.map((t) => (
                    <option key={t.id} value={t.id} className="text-zinc-900">
                      {t.title} ({t.questionsCount} soal)
                    </option>
                  ))}
                </select>
              )}

              {selectedTryoutId && (
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-700">
                      Soal di tryout ini
                    </p>
                    {questions.length > 0 && (
                      <button
                        type="button"
                        onClick={selectAllQuestions}
                        className="text-xs font-medium text-zinc-800 underline"
                      >
                        {selectedQIds.size === questions.length ? "Batal pilih semua" : "Pilih semua"}
                      </button>
                    )}
                  </div>
                  {questionsLoading ? (
                    <p className="text-sm text-zinc-600">Memuat soal…</p>
                  ) : questions.length === 0 ? (
                    <p className="text-sm text-zinc-600">Tidak ada soal di tryout ini.</p>
                  ) : (
                    <ul className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-zinc-200 bg-zinc-100/80 p-2">
                      {questions.map((q) => (
                        <li key={q.id}>
                          <label className="flex cursor-pointer gap-2 rounded-md border border-zinc-200 bg-white px-2 py-2 text-zinc-900 hover:border-zinc-300 hover:bg-zinc-50">
                            <input
                              type="checkbox"
                              checked={selectedQIds.has(q.id)}
                              onChange={() => toggleQuestion(q.id)}
                              className="mt-1 h-4 w-4 shrink-0 border-zinc-400 text-zinc-900 accent-zinc-900"
                            />
                            <div className="min-w-0 flex-1 text-zinc-900">
                              <span className="block text-xs font-medium text-zinc-700">
                                {typeLabel(q.type)}
                              </span>
                              <QuestionBody
                                html={q.body}
                                imageUrl={q.imageUrl}
                                asPreview
                                className="!text-xs !text-zinc-900"
                              />
                            </div>
                          </label>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-zinc-100 px-5 py-3">
              <button
                type="button"
                onClick={() => setImportOpen(false)}
                className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Tutup
              </button>
              <button
                type="button"
                disabled={importBusy || selectedQIds.size === 0 || !selectedTryoutId}
                onClick={() => void runImport()}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                {importBusy ? "Mengimpor…" : `Tambahkan ke bank (${selectedQIds.size})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
