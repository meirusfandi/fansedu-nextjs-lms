import fs from "fs";
import path from "path";
import { normalizeQuestionBankEntries } from "./normalize";
import type { QuestionBankEntry } from "./types";

export const QUESTION_BANK_FILE = path.join(process.cwd(), "data", "question-bank.json");

export function readQuestionBankFromDisk(): QuestionBankEntry[] {
  try {
    const raw = fs.readFileSync(QUESTION_BANK_FILE, "utf-8");
    const parsed = JSON.parse(raw) as unknown;
    return normalizeQuestionBankEntries(parsed);
  } catch {
    return [];
  }
}

export function writeQuestionBankToDisk(entries: QuestionBankEntry[]): void {
  fs.mkdirSync(path.dirname(QUESTION_BANK_FILE), { recursive: true });
  fs.writeFileSync(QUESTION_BANK_FILE, JSON.stringify(entries, null, 2), "utf-8");
}

export function bankDedupeKey(e: Pick<QuestionBankEntry, "sourceTryoutId" | "sourceQuestionId">): string {
  return `${e.sourceTryoutId}:${e.sourceQuestionId}`;
}
