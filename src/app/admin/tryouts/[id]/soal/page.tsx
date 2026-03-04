"use client";

import { AdminSidebar } from "@/components/AdminSidebar";
import { Pagination, PAGE_SIZE } from "@/components/Pagination";
import {
  adminCreateQuestion,
  adminDeleteQuestion,
  adminGetTryout,
  adminListTryoutQuestions,
  adminUpdateQuestion,
  logout,
  clearAuthToken,
} from "@/lib/api";
import type { AdminCreateQuestionRequest, Question, TryoutSession } from "@/lib/api-types";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const TYPE_LABEL: Record<string, string> = {
  short: "Isian singkat",
  multiple_choice: "Pilihan ganda",
  true_false: "Benar/Salah",
};

const emptyQuestionForm: {
  sort_order: string;
  type: AdminCreateQuestionRequest["type"];
  body: string;
  optionsText: string;
  max_score: string;
} = {
  sort_order: "1",
  type: "multiple_choice",
  body: "",
  optionsText: "",
  max_score: "1",
};

export default function AdminTryoutSoalPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const tryoutId = params?.id as string | undefined;

  const [tryout, setTryout] = useState<TryoutSession | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState<"add" | "edit" | null>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyQuestionForm);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const sortedQuestions = useMemo(
    () => [...questions].sort((a, b) => a.sort_order - b.sort_order),
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

  const handleLogout = useCallback(() => {
    logout().catch(() => {});
    clearAuthToken();
    router.push("/login");
  }, [router]);

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
      sort_order: String((questions.length + 1)),
    });
    setEditingQuestionId(null);
    setModalOpen("add");
    setSubmitError(null);
  };

  const openEdit = (q: Question) => {
    setForm({
      sort_order: String(q.sort_order),
      type: q.type,
      body: q.body,
      optionsText: (q.options ?? []).join("\n"),
      max_score: String(q.max_score),
    });
    setEditingQuestionId(q.id);
    setModalOpen("edit");
    setSubmitError(null);
  };

  const closeModal = () => {
    setModalOpen(null);
    setEditingQuestionId(null);
    setForm(emptyQuestionForm);
    setSubmitError(null);
  };

  const parseOptions = (text: string): string[] => {
    return text
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tryoutId) return;
    setSubmitError(null);
    setSubmitLoading(true);
    try {
      const sortOrder = parseInt(form.sort_order, 10) || 1;
      const maxScore = parseInt(form.max_score, 10) || 1;
      const options =
        form.type === "multiple_choice" || form.type === "true_false"
          ? parseOptions(form.optionsText)
          : undefined;

      if (modalOpen === "add") {
        await adminCreateQuestion(tryoutId, {
          sort_order: sortOrder,
          type: form.type,
          body: form.body.trim(),
          options: options?.length ? options : undefined,
          max_score: maxScore,
        });
      } else if (editingQuestionId) {
        await adminUpdateQuestion(tryoutId, editingQuestionId, {
          sort_order: sortOrder,
          type: form.type,
          body: form.body.trim(),
          options: options?.length ? options : undefined,
          max_score: maxScore,
        });
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
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-sm text-zinc-500">ID tryout tidak valid.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <AdminSidebar currentPath={pathname ?? ""} onLogout={handleLogout} />

      <main className="flex-1 px-4 py-5 sm:px-6 md:px-8 md:py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 md:mb-8">
          <div>
            <Link
              href="/admin/tryouts"
              className="text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              ← Daftar Tryout
            </Link>
            <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
              Soal Tryout
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {tryout ? tryout.title : "..."} — tambah dan kelola soal.
            </p>
          </div>
          <button
            type="button"
            onClick={openAdd}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            + Tambah Soal
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
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
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {paginatedQuestions.map((q) => (
                  <div
                    key={q.id}
                    className="flex items-start justify-between gap-4 px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200">
                          #{q.sort_order}
                        </span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          {TYPE_LABEL[q.type] ?? q.type} · Skor: {q.max_score}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-zinc-900 dark:text-zinc-50">
                        {q.body}
                      </p>
                      {q.options && q.options.length > 0 && (
                        <ul className="mt-1 list-inside list-disc text-xs text-zinc-500 dark:text-zinc-400">
                          {q.options.map((opt, i) => (
                            <li key={i}>{opt}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(q)}
                        className="rounded border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(q.id)}
                        className="rounded border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/30"
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
      </main>

      {modalOpen && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {modalOpen === "add" ? "Tambah Soal" : "Edit Soal"}
            </h2>
            {submitError && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                {submitError}
              </div>
            )}
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Urutan *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={form.sort_order}
                    onChange={(e) =>
                      setForm({ ...form, sort_order: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
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
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  >
                    <option value="short">Isian singkat</option>
                    <option value="multiple_choice">Pilihan ganda</option>
                    <option value="true_false">Benar/Salah</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Pertanyaan (body) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  placeholder="Teks soal..."
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                />
              </div>

              {(form.type === "multiple_choice" || form.type === "true_false") && (
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Opsi (satu per baris) {form.type === "true_false" ? "— mis. Benar, Salah" : ""}
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
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                </div>
              )}

              <div className="max-w-[6rem]">
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Skor max *
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.max_score}
                  onChange={(e) => setForm({ ...form, max_score: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
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
