import type { QuestionOption, QuestionType } from "@/lib/api-types";

/** Salinan soal dari tryout yang disimpan di bank (file JSON lokal / API Next). */
export interface QuestionBankEntry {
  id: string;
  sourceTryoutId: string;
  sourceTryoutTitle?: string | null;
  sourceQuestionId: string;
  type: QuestionType;
  body: string;
  options: QuestionOption[] | null;
  maxScore: number;
  correctOption?: string | null;
  correctText?: string | null;
  imageUrl?: string | null;
  importedAt: string;
  /** Snapshot saat impor / dari metadata tryout (opsional). */
  levelId?: string | null;
  levelName?: string | null;
  subjectId?: string | null;
  subjectName?: string | null;
}
