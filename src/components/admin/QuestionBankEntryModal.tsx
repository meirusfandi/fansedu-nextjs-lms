"use client";

import { QuestionBody } from "@/components/QuestionBody";
import { RichTextEditor } from "@/components/RichTextEditor";
import { updateQuestionBankEntry } from "@/lib/question-bank-client";
import type { QuestionBankEntry } from "@/lib/question-bank/types";
import type { QuestionType } from "@/lib/api-types";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const TYPE_LABEL: Record<string, string> = {
  short: "Isian singkat",
  multiple_choice: "Pilihan ganda",
  true_false: "Benar/Salah",
};

type Tab = "detail" | "edit";

type BankForm = {
  type: QuestionType;
  body: string;
  optionsText: string;
  maxScore: string;
  correctOption: string;
  correctText: string;
  imageUrl: string;
};

const emptyForm: BankForm = {
  type: "multiple_choice",
  body: "",
  optionsText: "",
  maxScore: "1",
  correctOption: "",
  correctText: "",
  imageUrl: "",
};

function optionsLinesFromEntry(e: QuestionBankEntry): string {
  const o = e.options;
  if (!o?.length) return "";
  return o.map((x) => x.label).join("\n");
}

function defaultCorrectKey(e: QuestionBankEntry): string {
  const co = e.correctOption?.trim();
  if (co) return co.toUpperCase();
  const hit = e.options?.find((x) => x.correct);
  return hit?.key ? String(hit.key).toUpperCase() : "";
}

function entryToForm(e: QuestionBankEntry): BankForm {
  return {
    type: e.type,
    body: e.body,
    optionsText: optionsLinesFromEntry(e),
    maxScore: String(e.maxScore),
    correctOption: defaultCorrectKey(e),
    correctText: e.correctText ?? "",
    imageUrl: e.imageUrl ?? "",
  };
}

function parseOptions(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function formatImportedAt(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function QuestionBankEntryModal({
  entry,
  open,
  onClose,
  onSaved,
}: {
  entry: QuestionBankEntry | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [tab, setTab] = useState<Tab>("detail");
  const [form, setForm] = useState<BankForm>(emptyForm);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setTab("detail");
      setSubmitError(null);
    }
  }, [open, entry?.id]);

  useEffect(() => {
    if (entry && tab === "edit") {
      setForm(entryToForm(entry));
      setSubmitError(null);
    }
  }, [entry, tab]);

  const mcOptionKeys = useMemo(() => {
    let lines = parseOptions(form.optionsText);
    if (form.type === "true_false" && lines.length === 0) {
      lines = ["Benar", "Salah"];
    }
    return lines.map((_, i) => String.fromCharCode(65 + i));
  }, [form.optionsText, form.type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entry) return;
    const raw = (form.body || "").trim();
    const bodyText = raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const hasImage = /<img\s/i.test(raw);
    if (!bodyText && !hasImage && !form.imageUrl.trim()) {
      setSubmitError("Isi pertanyaan (body) atau URL gambar.");
      return;
    }
    setSubmitError(null);
    setSubmitLoading(true);
    try {
      const maxScore = parseInt(form.maxScore, 10) || 1;
      const ct = form.correctText.trim();
      const img = form.imageUrl.trim();

      if (form.type === "short") {
        await updateQuestionBankEntry(entry.id, {
          type: form.type,
          body: form.body.trim(),
          maxScore,
          options: null,
          correctOption: null,
          correctText: ct ? ct : null,
          imageUrl: img ? img : null,
        });
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
        await updateQuestionBankEntry(entry.id, {
          type: form.type,
          body: form.body.trim(),
          maxScore,
          options,
          correctOption: key,
          correctText: null,
          imageUrl: img ? img : null,
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      setSubmitError((err as Error).message ?? "Gagal menyimpan");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (!open || !entry) return null;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4 [color-scheme:light]">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-2xl border border-zinc-200 bg-white text-zinc-900 shadow-xl">
        <div className="flex items-start justify-between border-b border-zinc-100 px-5 py-4">
          <div className="min-w-0 pr-2">
            <h2 className="text-lg font-semibold text-zinc-900">Soal di bank</h2>
            <p className="mt-1 text-xs text-zinc-600">
              Lihat lengkap isi soal, opsi, dan kunci; edit hanya memengaruhi salinan di bank (bukan tryout asal).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg px-2 py-1 text-sm text-zinc-700 hover:bg-zinc-100"
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>

        <div className="border-b border-zinc-100 px-5">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setTab("detail")}
              className={`border-b-2 px-3 py-2 text-sm font-medium ${
                tab === "detail"
                  ? "border-zinc-900 text-zinc-900"
                  : "border-transparent text-zinc-500 hover:text-zinc-700"
              }`}
            >
              Detail
            </button>
            <button
              type="button"
              onClick={() => setTab("edit")}
              className={`border-b-2 px-3 py-2 text-sm font-medium ${
                tab === "edit"
                  ? "border-zinc-900 text-zinc-900"
                  : "border-transparent text-zinc-500 hover:text-zinc-700"
              }`}
            >
              Edit
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {tab === "detail" && (
            <div className="space-y-4 text-zinc-900">
              <div className="flex flex-wrap gap-2 text-xs text-zinc-600">
                <span className="rounded bg-zinc-100 px-2 py-0.5 font-medium text-zinc-800">
                  {TYPE_LABEL[entry.type] ?? entry.type}
                </span>
                <span>Skor maks: {entry.maxScore}</span>
                <span>· Diimpor: {formatImportedAt(entry.importedAt)}</span>
              </div>
              {entry.sourceTryoutTitle && (
                <p className="text-sm text-zinc-700">
                  Sumber:{" "}
                  <Link
                    href={`/admin/tryouts/${entry.sourceTryoutId}/soal`}
                    className="font-medium text-emerald-700 underline hover:text-emerald-900"
                  >
                    {entry.sourceTryoutTitle}
                  </Link>
                </p>
              )}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-600">Pertanyaan</p>
                <div className="rounded-lg border border-zinc-200 bg-zinc-50/80 p-3">
                  <QuestionBody html={entry.body ?? ""} imageUrl={entry.imageUrl} />
                </div>
              </div>
              {entry.options && entry.options.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-600">
                    Opsi jawaban
                  </p>
                  <ul className="list-inside list-disc space-y-1 text-sm text-zinc-800">
                    {entry.options.map((opt, i) => (
                      <li
                        key={`${opt.key}-${i}`}
                        className={opt.correct ? "font-medium text-emerald-800" : ""}
                      >
                        <span className="font-mono text-xs">{opt.key}.</span> {opt.label}
                        {opt.correct ? " (kunci)" : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {entry.type === "short" && entry.correctText && (
                <p className="text-sm text-zinc-800">
                  <span className="font-semibold text-zinc-600">Kunci isian: </span>
                  {entry.correctText}
                </p>
              )}
              {entry.imageUrl && (
                <p className="text-xs text-zinc-600">
                  URL gambar (tambahan):{" "}
                  <span className="break-all font-mono text-zinc-800">{entry.imageUrl}</span>
                </p>
              )}
            </div>
          )}

          {tab === "edit" && (
            <form id="bank-entry-edit-form" onSubmit={handleSubmit} className="space-y-4">
              {submitError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {submitError}
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-zinc-800">Tipe *</label>
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm({ ...form, type: e.target.value as QuestionType })
                  }
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
                >
                  <option value="multiple_choice" className="text-zinc-900">
                    Pilihan ganda
                  </option>
                  <option value="true_false" className="text-zinc-900">
                    Benar/Salah
                  </option>
                  <option value="short" className="text-zinc-900">
                    Isian singkat
                  </option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-800">Skor maks *</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={form.maxScore}
                  onChange={(e) => setForm({ ...form, maxScore: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-800">URL gambar (opsional)</label>
                <input
                  type="text"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="https://…"
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-800">Pertanyaan (body) *</label>
                <p className="mt-0.5 text-[11px] text-zinc-600">
                  Teks, daftar, gambar, atau mode kode — sama seperti editor soal tryout.
                </p>
                <div className="mt-1">
                  <RichTextEditor
                    value={form.body}
                    onChange={(html) => setForm({ ...form, body: html })}
                    placeholder="Ketik pertanyaan…"
                    minHeight={220}
                  />
                </div>
              </div>
              {(form.type === "multiple_choice" || form.type === "true_false") && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-zinc-800">
                      Opsi (satu per baris) *
                    </label>
                    <p className="mt-0.5 text-[11px] text-zinc-600">
                      Benar/Salah: kosongkan untuk memakai &quot;Benar&quot; dan &quot;Salah&quot; otomatis.
                    </p>
                    <textarea
                      value={form.optionsText}
                      onChange={(e) => setForm({ ...form, optionsText: e.target.value })}
                      rows={5}
                      className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm text-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-800">Kunci jawaban *</label>
                    <select
                      value={form.correctOption}
                      onChange={(e) => setForm({ ...form, correctOption: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
                    >
                      <option value="">— Pilih —</option>
                      {mcOptionKeys.map((k) => (
                        <option key={k} value={k} className="text-zinc-900">
                          {k}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              {form.type === "short" && (
                <div>
                  <label className="block text-xs font-medium text-zinc-800">
                    Kunci isian (varian dipisah |)
                  </label>
                  <input
                    type="text"
                    value={form.correctText}
                    onChange={(e) => setForm({ ...form, correctText: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
                  />
                </div>
              )}
            </form>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-zinc-100 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Tutup
          </button>
          {tab === "edit" && (
            <button
              type="submit"
              form="bank-entry-edit-form"
              disabled={submitLoading}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {submitLoading ? "Menyimpan…" : "Simpan perubahan"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
