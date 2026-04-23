import {
  adminCreateQuestion,
  adminGetTryout,
  adminListTryoutQuestions,
  aiGenerateQuestions,
} from "@/lib/api";
import type {
  AdminCreateQuestionRequest,
  AiQuestionItem,
  GenerateQuestionsRequest,
  Question,
  QuestionOption,
} from "@/lib/api-types";
import { appendQuestionBankEntries, buildBankEntryFromQuestion, type QuestionBankImportContext } from "@/lib/question-bank-client";

/** Map satu item AI ke payload create soal tryout. */
export function aiQuestionItemToCreateRequest(
  item: AiQuestionItem,
  sortOrder: number,
  maxScore = 1
): AdminCreateQuestionRequest {
  const rawChoices = item.choicesJson ?? [];
  const choices = rawChoices.map((c) => String(c).trim()).filter(Boolean);
  const body = (item.questionText ?? "").trim() || "(Tanpa teks soal)";

  if (choices.length >= 2) {
    const options: QuestionOption[] = choices.map((label, i) => {
      const key = String.fromCharCode(65 + i);
      return { key, label, correct: false };
    });
    let correctKey: string | null = null;
    const ca = (item.correctAnswer ?? "").trim();
    if (ca) {
      const upper = ca.toUpperCase();
      if (/^[A-Z]$/.test(upper) && options.some((o) => o.key === upper)) {
        correctKey = upper;
      } else {
        const idx = choices.findIndex(
          (l) => l.toLowerCase() === ca.toLowerCase() || l === ca
        );
        if (idx >= 0) correctKey = String.fromCharCode(65 + idx);
        else {
          const n = parseInt(ca, 10);
          if (!Number.isNaN(n) && n >= 0 && n < options.length) {
            correctKey = String.fromCharCode(65 + n);
          }
        }
      }
    }
    if (!correctKey) correctKey = options[0]!.key;
    const marked = options.map((o) => ({
      ...o,
      correct: o.key === correctKey,
    }));
    return {
      sortOrder,
      type: "multiple_choice",
      body,
      maxScore,
      options: marked,
      correctOption: correctKey,
    };
  }

  const ct =
    (item.correctAnswer ?? "").trim() ||
    (item.explanation ?? "").trim().slice(0, 500) ||
    "";
  return {
    sortOrder,
    type: "short",
    body,
    maxScore,
    ...(ct ? { correctText: ct } : {}),
  };
}

export type GenerateAndPersistAiResult = {
  created: number;
  bankAdded: number;
  bankSkipped: number;
};

/** Generate via AI → simpan ke tryout backend → tambahkan snapshot ke bank soal (JSON). */
export async function generateAndPersistAiQuestions(opts: {
  tryoutId: string;
  request: GenerateQuestionsRequest;
  importCtx?: QuestionBankImportContext | null;
  syncToBank?: boolean;
}): Promise<GenerateAndPersistAiResult> {
  const { tryoutId, request: genReq, importCtx, syncToBank = true } = opts;
  const tid = tryoutId.trim();
  if (!tid) throw new Error("Tryout tujuan wajib diisi.");

  const items = await aiGenerateQuestions(genReq);
  if (items.length === 0) {
    return { created: 0, bankAdded: 0, bankSkipped: 0 };
  }

  const t = await adminGetTryout(tid);
  const existing = await adminListTryoutQuestions(tid);
  let order = existing.reduce((m, q) => Math.max(m, q.sortOrder), 0) + 1;

  const createdQs: Question[] = [];
  for (const item of items) {
    const req = aiQuestionItemToCreateRequest(item, order++);
    const q = await adminCreateQuestion(tid, req);
    createdQs.push(q);
  }

  if (!syncToBank || createdQs.length === 0) {
    return { created: createdQs.length, bankAdded: 0, bankSkipped: 0 };
  }

  const entries = createdQs.map((q) =>
    buildBankEntryFromQuestion(q, tid, t.title, importCtx ?? null)
  );
  const bank = await appendQuestionBankEntries(entries);
  return {
    created: createdQs.length,
    bankAdded: bank.added,
    bankSkipped: bank.skipped,
  };
}
