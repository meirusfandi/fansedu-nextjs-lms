"use client";

import { QuestionBody } from "@/components/QuestionBody";
import type {
  AdminTryoutStudent,
  AttemptReviewItem,
} from "@/lib/api-types";
import type {
  TryoutAnswerReviewBody,
  TryoutAnswerReviewBatchBody,
  TryoutAttemptAutoGradeBody,
} from "@/lib/api";
import { useCallback, useEffect, useState } from "react";

export type TryoutReviewApiClient = {
  getAttemptReview: (tryoutId: string, attemptId: string) => Promise<AttemptReviewItem[]>;
  putAnswerReview: (
    tryoutId: string,
    attemptId: string,
    questionId: string,
    body: TryoutAnswerReviewBody
  ) => Promise<unknown>;
  putReviewBatch?: (
    tryoutId: string,
    attemptId: string,
    body: TryoutAnswerReviewBatchBody
  ) => Promise<unknown>;
  postAutoGrade: (
    tryoutId: string,
    attemptId: string,
    body: TryoutAttemptAutoGradeBody
  ) => Promise<unknown>;
};

type RowEdit = {
  comment: string;
  manualScoreStr: string;
  initialComment: string;
  initialManual: number | null;
};

/** Bangun body PUT /review: hanya kirim key yang berubah (komentar saja / skor saja / keduanya). */
export function buildTryoutAnswerReviewBody(
  comment: string,
  initialComment: string,
  manualScoreStr: string,
  initialManual: number | null
): TryoutAnswerReviewBody | null {
  const body: TryoutAnswerReviewBody = {};
  if (comment !== initialComment) body.reviewerComment = comment;
  const trimmed = manualScoreStr.trim();
  if (trimmed === "") {
    if (initialManual != null) body.manualScore = null;
  } else {
    const n = Number(trimmed);
    if (Number.isFinite(n) && n !== initialManual) body.manualScore = n;
  }
  if (Object.keys(body).length === 0) return null;
  return body;
}

function rowsFromItems(items: AttemptReviewItem[]): Record<string, RowEdit> {
  const out: Record<string, RowEdit> = {};
  items.forEach((item) => {
    if (!item.questionId) return;
    const initialManual = typeof item.manualScore === "number" ? item.manualScore : null;
    const ic = item.reviewerComment ?? "";
    out[item.questionId] = {
      comment: ic,
      manualScoreStr: initialManual != null ? String(initialManual) : "",
      initialComment: ic,
      initialManual,
    };
  });
  return out;
}

type Props = {
  tryoutId: string;
  student: AdminTryoutStudent | null;
  api: TryoutReviewApiClient;
  onClose: () => void;
  onSaved?: () => void | Promise<void>;
  /** False untuk tryout `gradingMode: manual` — tombol auto-grade disembunyikan. */
  allowAutoGrade?: boolean;
};

export function TryoutAttemptReviewModal({
  tryoutId,
  student,
  api,
  onClose,
  onSaved,
  allowAutoGrade = true,
}: Props) {
  const [reviewItems, setReviewItems] = useState<AttemptReviewItem[]>([]);
  const [rowEdits, setRowEdits] = useState<Record<string, RowEdit>>({});
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSaving, setReviewSaving] = useState(false);
  const [autoGradeClearComments, setAutoGradeClearComments] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const attemptId = (() => {
    const raw = student?.attemptId;
    if (raw == null) return null;
    const s = String(raw).trim();
    return s === "" ? null : s;
  })();

  useEffect(() => {
    if (!actionNotice) return;
    const t = window.setTimeout(() => setActionNotice(null), 6000);
    return () => window.clearTimeout(t);
  }, [actionNotice]);

  const loadReview = useCallback(async () => {
    if (!tryoutId || !attemptId) return;
    setReviewLoading(true);
    setReviewError(null);
    try {
      const items = await api.getAttemptReview(tryoutId, attemptId);
      setReviewItems(items);
      setRowEdits(rowsFromItems(items));
    } catch (e) {
      setReviewError((e as Error).message ?? "Gagal memuat review jawaban.");
    } finally {
      setReviewLoading(false);
    }
  }, [api, tryoutId, attemptId]);

  useEffect(() => {
    if (!student || !attemptId) {
      setReviewItems([]);
      setRowEdits({});
      return;
    }
    void loadReview();
  }, [student, attemptId, loadReview]);

  const saveManualReview = async () => {
    if (!tryoutId || !attemptId) return;
    setReviewSaving(true);
    setReviewError(null);
    try {
      const answers = reviewItems
        .filter((item) => item.questionId)
        .map((item) => {
          const qid = item.questionId as string;
          const row = rowEdits[qid];
          if (!row) return null;
          const body = buildTryoutAnswerReviewBody(
            row.comment,
            row.initialComment,
            row.manualScoreStr,
            row.initialManual
          );
          if (!body) return null;
          return { questionId: qid, ...body };
        })
        .filter((x): x is { questionId: string; reviewerComment?: string; manualScore?: number | null } => x != null);
      if (answers.length > 0) {
        if (api.putReviewBatch) {
          await api.putReviewBatch(tryoutId, attemptId, { answers });
        } else {
          await Promise.all(
            answers.map((item) =>
              api.putAnswerReview(tryoutId, attemptId, item.questionId, {
                reviewerComment: item.reviewerComment,
                manualScore: item.manualScore,
              })
            )
          );
        }
      }
      await loadReview();
      await onSaved?.();
      setActionNotice("Perubahan review disimpan. Ringkasan di halaman diperbarui dari API.");
    } catch (e) {
      setReviewError((e as Error).message ?? "Gagal menyimpan penilaian manual.");
    } finally {
      setReviewSaving(false);
    }
  };

  const runAutoGrade = async () => {
    if (!tryoutId || !attemptId) return;
    setReviewSaving(true);
    setReviewError(null);
    try {
      await api.postAutoGrade(tryoutId, attemptId, {
        clearReviewerComments: autoGradeClearComments ? true : undefined,
      });
      await loadReview();
      await onSaved?.();
      setActionNotice(
        "Penilaian ulang otomatis selesai. Data review dan ringkasan di halaman diambil ulang dari API (tanpa reload halaman)."
      );
    } catch (e) {
      setReviewError((e as Error).message ?? "Gagal menjalankan penilaian otomatis.");
    } finally {
      setReviewSaving(false);
    }
  };

  if (!student) return null;

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-zinc-900">Review jawaban</h3>
            <p className="text-xs text-zinc-500">
              {student.name ?? "Siswa"} · {student.email ?? "—"}
            </p>
            {attemptId && (
              <p className="mt-0.5 font-mono text-[10px] text-zinc-400" title="ID attempt untuk request API">
                attempt: {attemptId}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-zinc-200 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100"
          >
            Tutup
          </button>
        </div>
        {reviewError && (
          <div className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {reviewError}
          </div>
        )}
        {actionNotice && (
          <div className="mt-3 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {actionNotice}
          </div>
        )}
        {reviewLoading ? (
          <p className="mt-4 text-sm text-zinc-500">Memuat review attempt...</p>
        ) : reviewItems.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">Data review kosong.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {reviewItems.map((item, idx) => {
              const qid = item.questionId ?? `idx-${idx}`;
              const row =
                rowEdits[item.questionId ?? ""] ??
                ({
                  comment: "",
                  manualScoreStr: "",
                  initialComment: "",
                  initialManual: null,
                } satisfies RowEdit);
              return (
                <div key={qid} className="rounded-lg border border-zinc-200 p-3">
                  <p className="text-xs text-zinc-500">Soal #{item.sortOrder ?? idx + 1}</p>
                  {item.isCorrect !== undefined && (
                    <p className="text-xs text-zinc-600">
                      Status otomatis: {item.isCorrect ? "Benar" : "Salah"}
                      {item.autoScore != null && Number.isFinite(item.autoScore) && (
                        <span className="ml-1">· Skor otomatis: {item.autoScore}</span>
                      )}
                    </p>
                  )}
                  <div className="mt-1 text-sm text-zinc-900">
                    <QuestionBody html={item.body ?? ""} imageUrl={item.imageUrl} />
                  </div>
                  <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-zinc-500">Jawaban siswa</p>
                      <p className="rounded bg-zinc-50 px-2 py-1 text-zinc-700">{item.userAnswer ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Kunci jawaban</p>
                      <p className="rounded bg-zinc-50 px-2 py-1 text-zinc-700">{item.correctAnswer ?? "—"}</p>
                    </div>
                  </div>
                  {item.questionId && (
                    <div className="mt-3 space-y-2">
                      <div>
                        <label className="text-xs font-medium text-zinc-600">Skor manual</label>
                        <input
                          type="number"
                          step="any"
                          min={0}
                          value={row.manualScoreStr}
                          onChange={(e) =>
                            setRowEdits((prev) => ({
                              ...prev,
                              [item.questionId as string]: {
                                ...(prev[item.questionId as string] ?? row),
                                manualScoreStr: e.target.value,
                              },
                            }))
                          }
                          className="mt-0.5 w-full max-w-[10rem] rounded border border-zinc-200 px-2 py-1 text-sm sm:w-32"
                          placeholder={allowAutoGrade ? "Kosong = otomatis" : "0 … max skor"}
                        />
                        <p className="mt-0.5 text-[11px] text-zinc-400">
                          {allowAutoGrade
                            ? "Isi angka untuk override; kosongkan untuk menghapus override dan kembali ke nilai otomatis."
                            : "Isi skor per soal (0 … bobot soal). Simpan perubahan review untuk mengirim ke server."}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-zinc-600">Komentar reviewer</label>
                        <textarea
                          value={row.comment}
                          onChange={(e) =>
                            setRowEdits((prev) => ({
                              ...prev,
                              [item.questionId as string]: {
                                ...(prev[item.questionId as string] ?? row),
                                comment: e.target.value,
                              },
                            }))
                          }
                          rows={2}
                          className="mt-0.5 w-full rounded border border-zinc-200 px-2 py-1 text-sm"
                          placeholder="Opsional"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <div className="mt-5 flex flex-col gap-3 border-t border-zinc-100 pt-4">
          {allowAutoGrade && (
            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-600">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={autoGradeClearComments}
                  onChange={(e) => setAutoGradeClearComments(e.target.checked)}
                  className="rounded border-zinc-300"
                />
                Saat auto-grade, hapus juga komentar reviewer
              </label>
            </div>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            {allowAutoGrade && (
              <button
                type="button"
                disabled={reviewSaving || reviewLoading || !attemptId}
                onClick={runAutoGrade}
                className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900 hover:bg-amber-100 disabled:opacity-50"
              >
                Jalankan penilaian ulang otomatis
              </button>
            )}
            <button
              type="button"
              disabled={reviewSaving || reviewLoading}
              onClick={saveManualReview}
              className="rounded border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
            >
              Simpan perubahan review
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
