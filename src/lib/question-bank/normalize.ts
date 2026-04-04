import type { QuestionType } from "@/lib/api-types";
import type { QuestionBankEntry } from "./types";

const TYPES: QuestionType[] = ["short", "multiple_choice", "true_false"];

function isQuestionType(s: string): s is QuestionType {
  return TYPES.includes(s as QuestionType);
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
    });
  }
  return out;
}
