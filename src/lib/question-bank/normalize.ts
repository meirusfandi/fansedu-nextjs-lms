import type { QuestionType } from "@/lib/api-types";
import type { QuestionBankEntry } from "./types";

const TYPES: QuestionType[] = ["short", "multiple_choice", "true_false"];

function isQuestionType(s: string): s is QuestionType {
  return TYPES.includes(s as QuestionType);
}

/** Gabungkan entri bank yang ada dengan patch (hanya field yang dikirim). */
export function mergeQuestionBankEntry(
  existing: QuestionBankEntry,
  patch: Record<string, unknown>
): QuestionBankEntry | null {
  const nextType = patch.type !== undefined ? String(patch.type) : existing.type;
  if (!isQuestionType(nextType)) return null;

  let maxScore = existing.maxScore;
  if (patch.maxScore !== undefined) {
    const n =
      typeof patch.maxScore === "number" && Number.isFinite(patch.maxScore)
        ? patch.maxScore
        : Number(patch.maxScore);
    if (Number.isFinite(n) && n >= 0) maxScore = n;
  }

  const body = patch.body !== undefined ? String(patch.body) : existing.body;

  let options = existing.options;
  if (patch.options !== undefined) {
    options = Array.isArray(patch.options) ? (patch.options as QuestionBankEntry["options"]) : null;
  }

  const correctOption =
    patch.correctOption !== undefined
      ? patch.correctOption === null
        ? null
        : String(patch.correctOption)
      : existing.correctOption;

  const correctText =
    patch.correctText !== undefined
      ? patch.correctText === null
        ? null
        : String(patch.correctText)
      : existing.correctText;

  const imageUrl =
    patch.imageUrl !== undefined
      ? patch.imageUrl === null || patch.imageUrl === ""
        ? null
        : String(patch.imageUrl)
      : existing.imageUrl;

  return {
    ...existing,
    type: nextType,
    body,
    options,
    maxScore,
    correctOption: correctOption ?? null,
    correctText: correctText ?? null,
    imageUrl: imageUrl ?? null,
  };
}

export function normalizeQuestionBankEntries(raw: unknown): QuestionBankEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: QuestionBankEntry[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const id = String(o.id ?? "").trim();
    const sourceTryoutId = String(o.sourceTryoutId ?? "").trim();
    const sourceQuestionId = String(o.sourceQuestionId ?? "").trim();
    const typeStr = String(o.type ?? "short");
    if (!id || !sourceTryoutId || !sourceQuestionId || !isQuestionType(typeStr)) continue;
    const body = String(o.body ?? "");
    const maxScore = typeof o.maxScore === "number" && Number.isFinite(o.maxScore) ? o.maxScore : 1;
    const options = Array.isArray(o.options) ? (o.options as QuestionBankEntry["options"]) : null;
    const levelId = o.levelId != null ? String(o.levelId) : null;
    const levelName = o.levelName != null ? String(o.levelName) : null;
    const subjectId = o.subjectId != null ? String(o.subjectId) : null;
    const subjectName = o.subjectName != null ? String(o.subjectName) : null;
    out.push({
      id,
      sourceTryoutId,
      sourceTryoutTitle: o.sourceTryoutTitle != null ? String(o.sourceTryoutTitle) : null,
      sourceQuestionId,
      type: typeStr,
      body,
      options,
      maxScore,
      correctOption: o.correctOption != null ? String(o.correctOption) : null,
      correctText: o.correctText != null ? String(o.correctText) : null,
      imageUrl: o.imageUrl != null ? String(o.imageUrl) : null,
      importedAt: String(o.importedAt ?? new Date().toISOString()),
      levelId: levelId && levelId.trim() ? levelId : null,
      levelName: levelName && levelName.trim() ? levelName : null,
      subjectId: subjectId && subjectId.trim() ? subjectId : null,
      subjectName: subjectName && subjectName.trim() ? subjectName : null,
    });
  }
  return out;
}
