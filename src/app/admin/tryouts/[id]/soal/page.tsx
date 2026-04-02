"use client";

import { Pagination, PAGE_SIZE } from "@/components/Pagination";
import { QuestionBody } from "@/components/QuestionBody";
import { RichTextEditor } from "@/components/RichTextEditor";
import {
  adminCreateQuestion,
  adminDeleteQuestion,
  adminGetTryout,
  adminListTryoutQuestions,
  adminUpdateQuestion,
} from "@/lib/api";
import type { AdminCreateQuestionRequest, Question, TryoutSession } from "@/lib/api-types";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const TYPE_LABEL: Record<string, string> = {
  short: "Isian singkat",
  multiple_choice: "Pilihan ganda",
  true_false: "Benar/Salah",
};

const emptyQuestionForm: {
  sortOrder: string;
  type: AdminCreateQuestionRequest["type"];
  body: string;
  optionsText: string;
  maxScore: string;
  /** Key opsi benar (A, B, …) untuk PG/BS */
  correctOption: string;
  /** Kunci isian singkat; varian benar dipisah | */
  correctText: string;
} = {
  sortOrder: "1",
  type: "multiple_choice",
  body: "",
  optionsText: "",
  maxScore: "1",
  correctOption: "",
  correctText: "",
};

function optionsLinesFromQuestion(q: Question): string {
  const o = q.options;
  if (!o?.length) return "";
  return o.map((x) => x.label).join("\n");
}

function defaultCorrectKey(q: Question): string {
  const co = q.correctOption?.trim();
  if (co) return co.toUpperCase();
  const hit = q.options?.find((x) => x.correct);
  return hit?.key ? String(hit.key).toUpperCase() : "";
}

export default function AdminTryoutSoalPage() {
  const params = useParams();
  const tryoutId = params?.id as string | undefined;

  const [tryout, setTryout] = useState<TryoutSession | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState<"add" | "edit" | null>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editingOriginal, setEditingOriginal] = useState<Question | null>(null);
  const [form, setForm] = useState(emptyQuestionForm);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const sortedQuestions = useMemo(
    () => [...questions].sort((a, b) => a.sortOrder - b.sortOrder),
    [questions]
  );
  const paginatedQuestions = useMemo(
    () => sortedQuestions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [sortedQuestions, page]
  );
  useEffect(() => {
    if (questions.length > 0 && (page - 1) * PAGE_SIZE >= questions.length) {
      setPage(1);
    }
  }, [questions.length, page]);

  const loadData = useCallback(() => {
    if (!tryoutId) return;
    setLoading(true);
    setError(null);
    Promise.allSettled([
      adminGetTryout(tryoutId),
      adminListTryoutQuestions(tryoutId),
    ]).then(([tryoutResult, questionsResult]) => {
      const t =
        tryoutResult.status === "fulfilled"
          ? tryoutResult.value
          : null;
      const q =
        questionsResult.status === "fulfilled"
          ? questionsResult.value
          : [];
      if (tryoutResult.status === "rejected") {
        const err = tryoutResult.reason as Error & { status?: number };
        if (err?.status === 404 || err?.status === 405) {
          setTryout(null);
          setQuestions(q);
          setError(null);
        } else {
          setError(err?.message ?? "Gagal memuat data");
          setTryout(null);
          setQuestions([]);
        }
      } else {
        setTryout(t);
        setQuestions(q);
      }
      setLoading(false);
    });
  }, [tryoutId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openAdd = () => {
    setForm({
      ...emptyQuestionForm,
      sortOrder: String(questions.length + 1),
    });
    setEditingQuestionId(null);
    setEditingOriginal(null);
    setModalOpen("add");
    setSubmitError(null);
  };

  const openEdit = (q: Question) => {
    setForm({
      sortOrder: String(q.sortOrder),
      type: q.type,
      body: q.body,
      optionsText: optionsLinesFromQuestion(q),
      maxScore: String(q.maxScore),
      correctOption: defaultCorrectKey(q),
      correctText: q.correctText ?? "",
    });
    setEditingQuestionId(q.id);
    setEditingOriginal(q);
    setModalOpen("edit");
    setSubmitError(null);
  };

  const closeModal = () => {
    setModalOpen(null);
    setEditingQuestionId(null);
    setEditingOriginal(null);
    setForm(emptyQuestionForm);
    setSubmitError(null);
  };

  const parseOptions = (text: string): string[] => {
    return text
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const mcOptionKeys = useMemo(() => {
    let lines = parseOptions(form.optionsText);
    if (form.type === "true_false" && lines.length === 0) {
      lines = ["Benar", "Salah"];
    }
    return lines.map((_, i) => String.fromCharCode(65 + i));
  }, [form.optionsText, form.type]);

  const buildQuestionPatch = (
    original: Question | null,
    next: AdminCreateQuestionRequest
  ): Partial<AdminCreateQuestionRequest> => {
    if (!original) return next;
    const patch: Partial<AdminCreateQuestionRequest> = {};
    if (next.sortOrder !== original.sortOrder) patch.sortOrder = next.sortOrder;
    if (next.type !== original.type) patch.type = next.type;
    if (next.body !== original.body) patch.body = next.body;
    if ((next.maxScore ?? 0) !== original.maxScore) patch.maxScore = next.maxScore;
    if ((next.correctOption ?? null) !== (original.correctOption ?? null)) {
      patch.correctOption = next.correctOption;
    }
    if ((next.correctText ?? null) !== (original.correctText ?? null)) {
      patch.correctText = next.correctText;
    }
    const oldOpt = JSON.stringify(original.options ?? []);
    const newOpt = JSON.stringify(next.options ?? []);
    if (oldOpt !== newOpt) patch.options = next.options;
    return patch;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tryoutId) return;
    const raw = (form.body || "").trim();
    const bodyText = raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const hasImage = /<img\s/i.test(raw);
    if (!bodyText && !hasImage) {
      setSubmitError("Pertanyaan (body) wajib diisi.");
      return;
    }
    setSubmitError(null);
    setSubmitLoading(true);
    try {
      const sortOrder = parseInt(form.sortOrder, 10) || 1;
      const maxScore = parseInt(form.maxScore, 10) || 1;
      const ct = form.correctText.trim();

      if (form.type === "short") {
        const base: AdminCreateQuestionRequest = {
          sortOrder,
          type: form.type,
          body: form.body.trim(),
          maxScore,
          ...(ct ? { correctText: ct } : {}),
        };
        if (modalOpen === "add") {
          await adminCreateQuestion(tryoutId, base);
        } else if (editingQuestionId) {
          const patch = buildQuestionPatch(editingOriginal, base);
          if (Object.keys(patch).length > 0) {
            await adminUpdateQuestion(tryoutId, editingQuestionId, patch);
          }
        }
      } else {
        let lines = parseOptions(form.optionsText);
        if (form.type === "true_false" && lines.length < 2) {
          lines = ["Benar", "Salah"];
        }
        if (lines.length < 2) {
          setSubmitError("Untuk pilihan ganda / benar-salah: isi minimal dua opsi (satu per baris).");
          setSubmitLoading(false);
          return;
        }
        const key = form.correctOption.trim().toUpperCase();
        const expectedKeys = lines.map((_, i) => String.fromCharCode(65 + i));
        if (!key || !expectedKeys.includes(key)) {
          setSubmitError("Pilih kunci jawaban (A, B, …) yang sesuai dengan opsi.");
          setSubmitLoading(false);
          return;
        }
        const options = lines.map((label, i) => {
          const k = String.fromCharCode(65 + i);
          return { key: k, label, correct: k === key };
        });
        const mcPayload: AdminCreateQuestionRequest = {
          sortOrder,
          type: form.type,
          body: form.body.trim(),
          maxScore,
          options,
          correctOption: key,
        };
        if (modalOpen === "add") {
          await adminCreateQuestion(tryoutId, mcPayload);
        } else if (editingQuestionId) {
          const patch = buildQuestionPatch(editingOriginal, mcPayload);
          if (Object.keys(patch).length > 0) {
            await adminUpdateQuestion(tryoutId, editingQuestionId, patch);
          }
        }
      }
      closeModal();
      loadData();
    } catch (err) {
      setSubmitError((err as Error).message ?? "Gagal menyimpan soal");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (questionId: string) => {
    if (!tryoutId) return;
    if (!confirm("Hapus soal ini?")) return;
    try {
      await adminDeleteQuestion(tryoutId, questionId);
      loadData();
    } catch (err) {
      setError((err as Error).message ?? "Gagal menghapus");
    }
  };

  if (!tryoutId) {
    return (
      <div className="px-4 py-8">
        <p className="text-sm text-zinc-500">ID tryout tidak valid.</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-5 sm:px-6 md:px-8 md:py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 md:mb-8">
          <div>
            <Link
              href="/admin/tryouts"
              className="text-xs font-medium text-zinc-500 hover:text-zinc-700"
            >
              ← Daftar Tryout
            </Link>
            <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
              Soal Tryout
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              {tryout ? tryout.title : "..."} — tambah dan kelola soal.
            </p>
          </div>
          <button
            type="button"
            onClick={openAdd}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 hover:bg-zinc-800"
          >
            + Tambah Soal
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-sm text-zinc-500">
              Memuat soal...
            </div>
          ) : questions.length === 0 ? (
            <div className="p-8 text-center text-sm text-zinc-500">
              <p>Belum ada soal.</p>
              <p className="mt-2 text-xs">
                Klik &quot;Tambah Soal&quot; untuk menambah soal (isian singkat, pilihan ganda, atau benar/salah).
              </p>
            </div>
          ) : (
            <>
            <div className="divide-y divide-zinc-200">
              {paginatedQuestions.map((q) => (
                  <div
                    key={q.id}
                    className="flex items-start justify-between gap-4 px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-xs font-medium text-zinc-700">
                          #{q.sortOrder}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {TYPE_LABEL[q.type] ?? q.type} · Skor: {q.maxScore}
                        </span>
                      </div>
                      <div className="mt-1">
                        <QuestionBody html={q.body} imageUrl={q.imageUrl} asPreview />
                      </div>
                      {q.options && q.options.length > 0 && (
                        <ul className="mt-1 list-inside list-disc text-xs text-zinc-500">
                          {q.options.map((opt, i) => (
                            <li
                              key={`${opt.key}-${i}`}
                              className={opt.correct ? "font-medium text-emerald-700" : ""}
                            >
                              <span className="font-mono">{opt.key}.</span> {opt.label}
                              {opt.correct ? " (kunci)" : ""}
                            </li>
                          ))}
                        </ul>
                      )}
                      {q.type === "short" && q.correctText && (
                        <p className="mt-1 text-[11px] text-zinc-500">
                          Kunci isian: <span className="text-zinc-700">{q.correctText}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(q)}
                        className="rounded border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(q.id)}
                        className="rounded border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
            </div>
            {questions.length > 0 && (
              <Pagination
                currentPage={page}
                totalItems={questions.length}
                onPageChange={setPage}
                label="soal"
              />
            )}
            </>
          )}
        </div>

      {modalOpen && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-zinc-900">
              {modalOpen === "add" ? "Tambah Soal" : "Edit Soal"}
            </h2>
            {submitError && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {submitError}
              </div>
            )}
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-600">
                    Urutan *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={form.sortOrder}
                    onChange={(e) =>
                      setForm({ ...form, sortOrder: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600">
                    Tipe *
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        type: e.target.value as AdminCreateQuestionRequest["type"],
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
                  >
                    <option value="short">Isian singkat</option>
                    <option value="multiple_choice">Pilihan ganda</option>
                    <option value="true_false">Benar/Salah</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600">
                  Pertanyaan (body) — editor kaya *
                </label>
                <p className="mt-0.5 text-[11px] text-zinc-500">
                  Format teks, list, link, gambar, video, dan mode kode (code view).
                </p>
                <div className="mt-1">
                  <RichTextEditor
                    value={form.body}
                    onChange={(html) => setForm({ ...form, body: html })}
                    placeholder="Ketik pertanyaan soal di sini..."
                    minHeight={260}
                  />
                </div>
                {form.body.trim() && (
                  <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50/50 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                      Preview
                    </p>
                    <div className="mt-1.5 min-h-[2rem]">
                      <QuestionBody html={form.body} />
                    </div>
                  </div>
                )}
              </div>

              {(form.type === "multiple_choice" || form.type === "true_false") && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-zinc-600">
                      Opsi (satu per baris) {form.type === "true_false" ? "— default Benar/Salah jika dikosongkan" : ""}
                    </label>
                    <textarea
                      rows={form.type === "true_false" ? 2 : 5}
                      value={form.optionsText}
                      onChange={(e) =>
                        setForm({ ...form, optionsText: e.target.value })
                      }
                      placeholder={
                        form.type === "true_false"
                          ? "Benar\nSalah"
                          : "Opsi A\nOpsi B\nOpsi C\nOpsi D"
                      }
                      className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-600">
                      Kunci jawaban (key) *
                    </label>
                    <select
                      required
                      value={form.correctOption}
                      onChange={(e) =>
                        setForm({ ...form, correctOption: e.target.value })
                      }
                      className="mt-1 w-full max-w-xs rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
                    >
                      <option value="">— Pilih —</option>
                      {mcOptionKeys.map((k) => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      A = baris pertama, B = kedua, dst. Dikirim ke API sebagai{" "}
                      <code className="rounded bg-zinc-100 px-0.5">correctOption</code> dan{" "}
                      <code className="rounded bg-zinc-100 px-0.5">options[].correct</code>.
                    </p>
                  </div>
                </>
              )}

              {form.type === "short" && (
                <div>
                  <label className="block text-xs font-medium text-zinc-600">
                    Kunci isian singkat (untuk auto-grade)
                  </label>
                  <input
                    type="text"
                    value={form.correctText}
                    onChange={(e) => setForm({ ...form, correctText: e.target.value })}
                    placeholder="contoh: Jakarta atau DKI Jakarta|Jakarta"
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
                  />
                  <p className="mt-1 text-[11px] text-zinc-500">
                    Beberapa jawaban benar dipisahkan dengan <code className="rounded bg-zinc-100 px-0.5">|</code>.
                    Kosongkan jika belum mau mengisi; saat edit, dikosongkan tidak mengirim field (kunci di DB tidak
                    diubah).
                  </p>
                </div>
              )}

              <div className="max-w-[6rem]">
                <label className="block text-xs font-medium text-zinc-600">
                  Skor max *
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.maxScore}
                  onChange={(e) => setForm({ ...form, maxScore: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 hover:bg-zinc-800 disabled:opacity-50"
                >
                  {submitLoading ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
