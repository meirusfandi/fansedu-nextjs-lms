"use client";

import { QuestionBody } from "@/components/QuestionBody";
import type { QuestionBankEntry } from "@/lib/question-bank/types";
import { JetBrains_Mono, Playfair_Display, Source_Serif_4 } from "next/font/google";
import { useCallback, useMemo, useState } from "react";
import styles from "./question-bank-osk.module.css";

const playfair = Playfair_Display({
  weight: ["600"],
  subsets: ["latin"],
  variable: "--font-qb-osk-display",
});
const sourceSerif = Source_Serif_4({
  weight: ["400", "600"],
  subsets: ["latin"],
  variable: "--font-qb-osk-serif",
});
const jetbrains = JetBrains_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-qb-osk-mono",
});

export type QuestionBankOskRow = {
  entry: QuestionBankEntry;
  serial: number;
  topicLine: string;
  diffClass: "easy" | "medium" | "hard";
  diffLabel: string;
  answerKey: string | null;
};

type Props = {
  rows: QuestionBankOskRow[];
  /** Judul di cover (mis. nama filter / bank). */
  coverTitle?: string;
  /** Subjudul cover. */
  coverSubtitle?: string;
  /** Teks pill tambahan di cover. */
  coverPills?: string[];
  /** Petunjuk halaman (pagination). */
  pageHint?: string | null;
};

function diffStyle(c: QuestionBankOskRow["diffClass"]): string {
  if (c === "easy") return styles.diffEasy;
  if (c === "hard") return styles.diffHard;
  return styles.diffMedium;
}

function sortOptions(entry: QuestionBankEntry) {
  const opts = entry.options ?? [];
  return [...opts].sort((a, b) =>
    String(a.key).localeCompare(String(b.key), "id", { numeric: true, sensitivity: "base" })
  );
}

export function QuestionBankOskPracticeView({
  rows,
  coverTitle = "Bank soal",
  coverSubtitle = "Latihan dengan gaya dokumen OSK — pilih jawaban, periksa, dan buka pembahasan.",
  coverPills = [],
  pageHint = null,
}: Props) {
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const [openSolutions, setOpenSolutions] = useState<Set<string>>(new Set());
  const [scoreVisible, setScoreVisible] = useState(false);

  const scorableIds = useMemo(
    () =>
      new Set(
        rows.filter((r) => r.answerKey && (r.entry.options?.length ?? 0) > 0).map((r) => r.entry.id)
      ),
    [rows]
  );

  const progressDenom = Math.max(scorableIds.size, 1);
  const progressNum = useMemo(() => {
    let n = 0;
    for (const id of scorableIds) {
      if (selected[id]) n += 1;
    }
    return n;
  }, [scorableIds, selected]);

  const stats = useMemo(() => {
    let benar = 0;
    let salah = 0;
    let kosong = 0;
    for (const r of rows) {
      if (!scorableIds.has(r.entry.id) || !r.answerKey) continue;
      const pick = selected[r.entry.id]?.trim().toUpperCase() ?? "";
      const key = r.answerKey.trim().toUpperCase();
      if (!pick) kosong += 1;
      else if (pick === key) benar += 1;
      else salah += 1;
    }
    const total = benar + salah + kosong;
    return { benar, salah, kosong, total };
  }, [rows, scorableIds, selected]);

  const toggleSolution = useCallback((id: string) => {
    setOpenSolutions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const checkAnswers = useCallback(() => {
    setChecked(true);
    setScoreVisible(true);
  }, []);

  const revealAllSolutions = useCallback(() => {
    setOpenSolutions(new Set(rows.map((r) => r.entry.id)));
  }, [rows]);

  const reset = useCallback(() => {
    setSelected({});
    setChecked(false);
    setOpenSolutions(new Set());
    setScoreVisible(false);
  }, []);

  const fontVars = `${playfair.variable} ${sourceSerif.variable} ${jetbrains.variable}`;

  return (
    <div className={`${styles.root} ${fontVars}`}>
      <header className={styles.cover}>
        <div className={styles.coverInner}>
          <p className={styles.coverLabel}>Dokumen latihan</p>
          <h1>{coverTitle}</h1>
          <p className={styles.coverSub}>{coverSubtitle}</p>
          <div className={styles.coverMeta}>
            {coverPills.filter(Boolean).map((t) => (
              <span key={t} className={styles.metaPill}>
                {t}
              </span>
            ))}
          </div>
        </div>
      </header>

      <div className={styles.main}>
        {pageHint ? <p className={styles.pageHint}>{pageHint}</p> : null}

        <div className={styles.progressBar} aria-hidden>
          <div
            className={styles.progressFill}
            style={{ width: `${Math.min(100, (progressNum / progressDenom) * 100)}%` }}
          />
        </div>

        <div className={styles.actionBar}>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={checkAnswers}>
            Periksa jawaban
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={revealAllSolutions}>
            Tampilkan semua pembahasan
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={reset}>
            Ulangi
          </button>
        </div>

        <div className={`${styles.scorePanel} ${scoreVisible ? styles.scorePanelVisible : ""}`}>
          <div className={styles.scoreMain}>
            {stats.total > 0 ? `${stats.benar} / ${stats.total}` : "—"}
          </div>
          <p className={styles.scoreSub}>
            {scorableIds.size === 0
              ? "Tidak ada soal pilihan ganda/benar-salah dengan kunci di halaman ini."
              : "Hanya soal beropsi dengan kunci yang dihitung."}
          </p>
          <div className={styles.scoreGrid}>
            <div className={styles.scoreCell}>
              <div className={styles.scoreCellLabel}>Benar</div>
              <div className={`${styles.scoreCellValue} ${styles.cGreen}`}>{stats.benar}</div>
            </div>
            <div className={styles.scoreCell}>
              <div className={styles.scoreCellLabel}>Salah</div>
              <div className={`${styles.scoreCellValue} ${styles.cRed}`}>{stats.salah}</div>
            </div>
            <div className={styles.scoreCell}>
              <div className={styles.scoreCellLabel}>Kosong</div>
              <div className={`${styles.scoreCellValue} ${styles.cGold}`}>{stats.kosong}</div>
            </div>
          </div>
        </div>

        <div className={styles.sectionHeader}>
          <div className={styles.sectionIcon} aria-hidden>
            <svg viewBox="0 0 24 24">
              <path d="M12 3L4 9v12h16V9l-8-6zm0 2.18l6 4.5V19H6v-9.32l6-4.5zM9 14h6v2H9v-2z" />
            </svg>
          </div>
          <div>
            <div className={styles.sectionTitle}>Soal</div>
          </div>
          <div className={styles.sectionCount}>{rows.length} soal</div>
        </div>

        {rows.map((r) => {
          const e = r.entry;
          const opts = sortOptions(e);
          const hasChoices = opts.length > 0;
          const id = e.id;
          const pick = selected[id] ?? "";
          const keyU = r.answerKey?.trim().toUpperCase() ?? "";
          const isOpen = openSolutions.has(id);

          const getChoiceState = (optKey: string): "neutral" | "selected" | "correct" | "wrong" => {
            const k = String(optKey).trim().toUpperCase();
            const pickU = pick.trim().toUpperCase();
            if (!checked || !keyU) {
              return pickU === k ? "selected" : "neutral";
            }
            if (k === keyU) return "correct";
            if (pickU === k && k !== keyU) return "wrong";
            return "neutral";
          };

          return (
            <article
              key={id}
              className={styles.questionCard}
              data-answer={r.answerKey ?? undefined}
            >
              <div className={styles.qHeader}>
                <span className={styles.qNumber}>SOAL {r.serial}</span>
                <span className={styles.qTopic}>{r.topicLine}</span>
                <span className={`${styles.qDifficulty} ${diffStyle(r.diffClass)}`}>{r.diffLabel}</span>
              </div>
              <div className={styles.qBody}>
                <div className={styles.qText}>
                  <QuestionBody html={e.body} imageUrl={e.imageUrl} />
                </div>

                {hasChoices ? (
                  <ul className={styles.choices} role="list">
                    {opts.map((o) => {
                      const st = getChoiceState(o.key);
                      const liCls = [
                        styles.choice,
                        st === "selected" && !checked ? styles.choiceSelected : "",
                        checked && st === "correct" ? styles.choiceCorrect : "",
                        checked && st === "wrong" ? styles.choiceWrong : "",
                      ]
                        .filter(Boolean)
                        .join(" ");
                      return (
                        <li key={o.key}>
                          <button
                            type="button"
                            className={liCls}
                            disabled={checked}
                            onClick={() => {
                              if (checked) return;
                              setSelected((prev) => ({
                                ...prev,
                                [id]: prev[id] === o.key ? "" : o.key,
                              }));
                            }}
                          >
                            <span className={styles.choiceLabel}>{o.key}.</span>
                            <span>{o.label}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className={styles.noChoices}>
                    Soal tanpa opsi (isian singkat). Lihat kunci di bagian pembahasan jika tersedia.
                  </p>
                )}

                <button
                  type="button"
                  className={`${styles.answerToggle} ${isOpen ? styles.answerToggleOpen : ""}`}
                  onClick={() => toggleSolution(id)}
                  aria-expanded={isOpen}
                >
                  <span className={styles.arrow} aria-hidden>
                    ▶
                  </span>
                  Lihat pembahasan
                </button>

                <div className={`${styles.solutionBox} ${isOpen ? styles.solutionBoxVisible : ""}`}>
                  <h4>Pembahasan</h4>
                  {r.answerKey ? (
                    <p>
                      Kunci pilihan: <strong>{r.answerKey}</strong>
                    </p>
                  ) : null}
                  {e.correctText?.trim() ? (
                    <p>
                      Jawaban referensi (isian): <strong>{e.correctText.trim()}</strong>
                    </p>
                  ) : null}
                  {!r.answerKey && !e.correctText?.trim() ? (
                    <p>Belum ada kunci jawaban di data bank untuk soal ini.</p>
                  ) : null}
                  {checked && hasChoices && keyU ? (
                    <div className={styles.solAnswer}>
                      {pick.trim().toUpperCase() === keyU
                        ? "Jawaban Anda benar"
                        : pick
                          ? "Jawaban Anda belum tepat"
                          : "Anda belum memilih jawaban"}
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}

        <div className={styles.ornament} aria-hidden>
          ◆ ◆ ◆
        </div>
      </div>
    </div>
  );
}
