import { adminGetTryout, adminListTryoutQuestions } from "@/lib/api";
import {
  appendQuestionBankEntries,
  buildBankEntryFromQuestion,
  type QuestionBankImportContext,
} from "@/lib/question-bank-client";

/** UUID tryout per baris atau koma (sama seperti program kelas). */
export function parseTryoutIdLines(text: string): string[] {
  return text
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Impor semua soal satu tryout ke bank (duplikat tryout+soal dilewati API). */
export async function syncTryoutToQuestionBank(
  tryoutId: string,
  importCtx?: QuestionBankImportContext | null
): Promise<{ added: number; skipped: number; total: number }> {
  const id = tryoutId.trim();
  if (!id) return { added: 0, skipped: 0, total: 0 };
  const t = await adminGetTryout(id);
  const questions = await adminListTryoutQuestions(id);
  const entries = questions.map((q) => buildBankEntryFromQuestion(q, id, t.title, importCtx ?? null));
  if (entries.length === 0) return { added: 0, skipped: 0, total: 0 };
  return appendQuestionBankEntries(entries);
}

export async function syncTryoutsToQuestionBank(
  tryoutIds: string[],
  importCtx?: QuestionBankImportContext | null
): Promise<{ totalAdded: number; totalSkipped: number; errors: string[] }> {
  const uniq = [...new Set(tryoutIds.map((s) => s.trim()).filter(Boolean))];
  let totalAdded = 0;
  let totalSkipped = 0;
  const errors: string[] = [];
  for (const id of uniq) {
    try {
      const r = await syncTryoutToQuestionBank(id, importCtx ?? null);
      totalAdded += r.added;
      totalSkipped += r.skipped;
    } catch (e) {
      const msg = (e as Error)?.message ?? String(e);
      errors.push(`${id.slice(0, 8)}…: ${msg}`);
    }
  }
  return { totalAdded, totalSkipped, errors };
}
