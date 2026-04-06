import type { Question } from "@/lib/api-types";
import type { QuestionBankEntry } from "@/lib/question-bank/types";

function newBankId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `qb-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export type QuestionBankImportContext = {
  levelId?: string | null;
  levelName?: string | null;
  subjectId?: string | null;
  subjectName?: string | null;
};

/** Bangun entri bank dari soal tryout (snapshot untuk disimpan di JSON). */
export function buildBankEntryFromQuestion(
  q: Question,
  tryoutId: string,
  tryoutTitle: string,
  context?: QuestionBankImportContext | null
): QuestionBankEntry {
  const trimOrNull = (s: string | null | undefined) => {
    const t = s != null ? String(s).trim() : "";
    return t ? t : null;
  };
  return {
    id: newBankId(),
    sourceTryoutId: tryoutId,
    sourceTryoutTitle: tryoutTitle,
    sourceQuestionId: q.id,
    type: q.type,
    body: q.body,
    options: q.options,
    maxScore: q.maxScore,
    correctOption: q.correctOption ?? null,
    correctText: q.correctText ?? null,
    imageUrl: q.imageUrl ?? null,
    importedAt: new Date().toISOString(),
    levelId: trimOrNull(context?.levelId),
    levelName: trimOrNull(context?.levelName),
    subjectId: trimOrNull(context?.subjectId),
    subjectName: trimOrNull(context?.subjectName),
  };
}

async function parseError(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { error?: string };
    return j?.error ?? res.statusText;
  } catch {
    return res.statusText;
  }
}

export async function fetchQuestionBank(): Promise<QuestionBankEntry[]> {
  const res = await fetch("/api/admin/question-bank", { credentials: "include" });
  if (!res.ok) throw new Error(await parseError(res));
  const j = (await res.json()) as { data?: QuestionBankEntry[] };
  return Array.isArray(j.data) ? j.data : [];
}

export async function appendQuestionBankEntries(
  entries: QuestionBankEntry[]
): Promise<{ added: number; skipped: number; total: number }> {
  const res = await fetch("/api/admin/question-bank", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entries }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const j = (await res.json()) as { added?: number; skipped?: number; total?: number };
  return {
    added: j.added ?? 0,
    skipped: j.skipped ?? 0,
    total: j.total ?? 0,
  };
}

export async function deleteQuestionBankEntry(id: string): Promise<void> {
  const res = await fetch(`/api/admin/question-bank?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(await parseError(res));
}

/** Perbarui soal di bank (field yang dikirim digabung ke entri yang ada). */
export async function updateQuestionBankEntry(
  id: string,
  patch: Partial<
    Pick<
      QuestionBankEntry,
      "type" | "body" | "options" | "maxScore" | "correctOption" | "correctText" | "imageUrl"
    >
  >
): Promise<QuestionBankEntry> {
  const res = await fetch("/api/admin/question-bank", {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...patch }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const j = (await res.json()) as { data?: QuestionBankEntry };
  if (!j.data) throw new Error("Respons tidak valid");
  return j.data;
}
