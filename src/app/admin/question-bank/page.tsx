"use client";

import { AiGenerateToTryoutBlock } from "@/components/admin/AiGenerateToTryoutBlock";
import { QuestionBankEntryModal } from "@/components/admin/QuestionBankEntryModal";
import { FlashNoticeBar, useFlashNotice } from "@/components/FlashNotice";
import { QuestionBody } from "@/components/QuestionBody";
import {
  QuestionBankOskPracticeView,
  type QuestionBankOskRow,
} from "@/components/question-bank/QuestionBankOskPracticeView";
import { Pagination, PAGE_SIZE } from "@/components/Pagination";
import {
  adminGetLevelSubjects,
  adminListLevels,
  adminListTryoutQuestions,
  adminListTryouts,
  getFriendlyApiErrorMessage,
} from "@/lib/api";
import type { Level, Question, TryoutSession } from "@/lib/api-types";
import { filterLevelsSDSMPSMA } from "@/features/admin/kelas-helpers";
import {
  appendQuestionBankEntries,
  buildBankEntryFromQuestion,
  deleteQuestionBankEntry,
  fetchQuestionBank,
  type QuestionBankImportContext,
} from "@/lib/question-bank-client";
import type { QuestionBankEntry } from "@/lib/question-bank/types";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type SubjectRow = { id: string; name: string; levelId: string; levelName: string };

type SubjectOption = { id: string; label: string };

/** Key React yang unik meski `e.id` bentrok di data lama / JSON korup. */
function bankEntryListKey(e: QuestionBankEntry): string {
  return `${e.sourceTryoutId}:${e.sourceQuestionId}:${e.id}`;
}

function dedupeTryoutsById(list: TryoutSession[]): TryoutSession[] {
  const m = new Map<string, TryoutSession>();
  for (const t of list) {
    if (t.id && !m.has(t.id)) m.set(t.id, t);
  }
  return Array.from(m.values());
}

function typeLabel(t: string): string {
  if (t === "multiple_choice") return "Pilihan ganda";
  if (t === "true_false") return "Benar/salah";
  return "Isian";
}

export default function AdminQuestionBankPage() {
  const { notice, showSuccess, clearNotice } = useFlashNotice();
  const [entries, setEntries] = useState<QuestionBankEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const [levels, setLevels] = useState<Level[]>([]);
  const [subjectsFlat, setSubjectsFlat] = useState<SubjectRow[]>([]);
  const [tryouts, setTryouts] = useState<TryoutSession[]>([]);
  const [metaLoading, setMetaLoading] = useState(true);

  const [filterLevelId, setFilterLevelId] = useState("");
  const [filterSubjectId, setFilterSubjectId] = useState("");

  const [importOpen, setImportOpen] = useState(false);
  const [tryoutsLoading, setTryoutsLoading] = useState(false);
  const [selectedTryoutId, setSelectedTryoutId] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [selectedQIds, setSelectedQIds] = useState<Set<string>>(new Set());
  const [importBusy, setImportBusy] = useState(false);
  const [importNotice, setImportNotice] = useState<string | null>(null);

  const [bankModalEntry, setBankModalEntry] = useState<QuestionBankEntry | null>(null);
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "osk">("list");
  const [aiGenOpen, setAiGenOpen] = useState(false);
  const [aiGenTryoutId, setAiGenTryoutId] = useState("");

  const loadBank = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchQuestionBank();
      setEntries(list.sort((a, b) => b.importedAt.localeCompare(a.importedAt)));
    } catch (e) {
      setError(getFriendlyApiErrorMessage(e));
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMeta = useCallback(async () => {
    setMetaLoading(true);
    try {
      const [lv, tlist] = await Promise.all([adminListLevels(), adminListTryouts()]);
      const filteredLevels = filterLevelsSDSMPSMA(lv ?? []);
      setLevels(filteredLevels);
      const rows = await Promise.all(
        filteredLevels.map(async (l) => {
          try {
            const subs = await adminGetLevelSubjects(l.id);
            return (subs ?? []).map((s) => ({
              id: s.id,
              name: s.name,
              levelId: l.id,
              levelName: l.name,
            }));
          } catch {
            return [];
          }
        })
      );
      setSubjectsFlat(rows.flat());
      setTryouts(dedupeTryoutsById(Array.isArray(tlist) ? tlist : []));
    } catch {
      setLevels([]);
      setSubjectsFlat([]);
      setTryouts([]);
    } finally {
      setMetaLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBank();
    void loadMeta();
  }, [loadBank, loadMeta]);

  const tryoutById = useMemo(() => {
    const m: Record<string, TryoutSession> = {};
    for (const t of tryouts) {
      if (t.id) m[t.id] = t;
    }
    return m;
  }, [tryouts]);

  const levelById = useMemo(() => new Map(levels.map((l) => [l.id, l] as const)), [levels]);

  const subjectNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of subjectsFlat) {
      if (!m.has(s.id)) m.set(s.id, s.name);
    }
    return m;
  }, [subjectsFlat]);

  const bankImportCtxForAi = useMemo((): QuestionBankImportContext | null => {
    const sid = filterSubjectId.trim();
    const lid = filterLevelId.trim();
    if (!sid && !lid) return null;
    return {
      subjectId: sid || null,
      subjectName: sid ? subjectNameById.get(sid) ?? null : null,
      levelId: lid || null,
      levelName: lid ? levelById.get(lid)?.name ?? null : null,
    };
  }, [filterLevelId, filterSubjectId, levelById, subjectNameById]);

  /** Satu baris per subject id (subjek sama di banyak jenjang tidak boleh duplikat key `<option>`). */
  const subjectSelectOptions = useMemo((): SubjectOption[] => {
    const src = filterLevelId ? subjectsFlat.filter((s) => s.levelId === filterLevelId) : subjectsFlat;
    const byId = new Map<string, { name: string; levels: Set<string> }>();
    for (const s of src) {
      let row = byId.get(s.id);
      if (!row) {
        row = { name: s.name, levels: new Set([s.levelName]) };
        byId.set(s.id, row);
      } else {
        row.levels.add(s.levelName);
      }
    }
    const opts: SubjectOption[] = [];
    for (const [id, v] of byId) {
      const levelsStr = Array.from(v.levels).sort().join(", ");
      opts.push({
        id,
        label: filterLevelId ? v.name : `${v.name} (${levelsStr})`,
      });
    }
    opts.sort((a, b) => a.label.localeCompare(b.label, "id"));
    return opts;
  }, [subjectsFlat, filterLevelId]);

  useEffect(() => {
    if (filterSubjectId && !subjectSelectOptions.some((o) => o.id === filterSubjectId)) {
      setFilterSubjectId("");
    }
  }, [filterSubjectId, subjectSelectOptions]);

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      const t = tryoutById[e.sourceTryoutId];
      const levelId = (e.levelId ?? t?.levelId ?? "").trim();
      const subjectId = (e.subjectId ?? t?.subjectId ?? "").trim();
      if (filterLevelId && levelId !== filterLevelId) return false;
      if (filterSubjectId && subjectId !== filterSubjectId) return false;
      return true;
    });
  }, [entries, filterLevelId, filterSubjectId, tryoutById]);

  const paginated = useMemo(
    () => filteredEntries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredEntries, page]
  );

  const oskRows = useMemo((): QuestionBankOskRow[] => {
    return paginated.map((e, idx) => {
      const tMeta = tryoutById[e.sourceTryoutId];
      const lid = (e.levelId ?? tMeta?.levelId ?? "").trim() || null;
      const sid = (e.subjectId ?? tMeta?.subjectId ?? "").trim() || null;
      const levelLabel =
        e.levelName?.trim() ||
        tMeta?.levelName?.trim() ||
        (lid ? levelById.get(lid)?.name : null) ||
        null;
      const subjectLabel =
        e.subjectName?.trim() ||
        tMeta?.subjectName?.trim() ||
        (sid ? subjectNameById.get(sid) : null) ||
        null;
      const parts = [subjectLabel, levelLabel].filter(Boolean) as string[];
      const topicLine = parts.length > 0 ? parts.join(" · ") : typeLabel(e.type);

      const tl = tMeta?.level;
      let diffClass: QuestionBankOskRow["diffClass"] = "medium";
      let diffLabel = "Sedang";
      if (tl === "easy") {
        diffClass = "easy";
        diffLabel = "Mudah";
      } else if (tl === "hard") {
        diffClass = "hard";
        diffLabel = "Sulit";
      }

      const co = e.correctOption?.trim();
      const fromOpt = e.options?.find((o) => o.correct)?.key;
      const answerKey = co
        ? co.toUpperCase()
        : fromOpt
          ? String(fromOpt).trim().toUpperCase()
          : null;

      return {
        entry: e,
        serial: (page - 1) * PAGE_SIZE + idx + 1,
        topicLine,
        diffClass,
        diffLabel,
        answerKey,
      };
    });
  }, [paginated, tryoutById, levelById, subjectNameById]);

  const oskCoverPills = useMemo(() => {
    const p: string[] = [];
    if (filterLevelId) {
      const name = levelById.get(filterLevelId)?.name;
      if (name) p.push(`Jenjang: ${name}`);
    }
    if (filterSubjectId) {
      const name = subjectNameById.get(filterSubjectId);
      if (name) p.push(`Bidang: ${name}`);
    }
    return p;
  }, [filterLevelId, filterSubjectId, levelById, subjectNameById]);

  const oskPageHint = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(filteredEntries.length / PAGE_SIZE));
    if (filteredEntries.length <= PAGE_SIZE) return null;
    return `Halaman ${page} dari ${totalPages} · ${filteredEntries.length} soal sesuai filter`;
  }, [filteredEntries.length, page]);

  useEffect(() => {
    if (filteredEntries.length > 0 && (page - 1) * PAGE_SIZE >= filteredEntries.length) {
      setPage(1);
    }
  }, [filteredEntries.length, page]);

  useEffect(() => {
    setPage(1);
  }, [filterLevelId, filterSubjectId]);

  const openImport = async () => {
    setImportOpen(true);
    setImportNotice(null);
    setSelectedTryoutId("");
    setQuestions([]);
    setSelectedQIds(new Set());
    if (tryouts.length > 0) return;
    setTryoutsLoading(true);
    try {
      const list = await adminListTryouts();
      setTryouts(dedupeTryoutsById(Array.isArray(list) ? list : []));
    } catch (e) {
      setImportNotice(getFriendlyApiErrorMessage(e));
      setTryouts([]);
    } finally {
      setTryoutsLoading(false);
    }
  };

  const loadQuestionsForTryout = async (tryoutId: string) => {
    if (!tryoutId) {
      setQuestions([]);
      setSelectedQIds(new Set());
      return;
    }
    setQuestionsLoading(true);
    setImportNotice(null);
    try {
      const list = await adminListTryoutQuestions(tryoutId);
      setQuestions(list);
      setSelectedQIds(new Set());
    } catch (e) {
      setImportNotice(getFriendlyApiErrorMessage(e));
      setQuestions([]);
    } finally {
      setQuestionsLoading(false);
    }
  };

  const selectedTryout = tryouts.find((t) => t.id === selectedTryoutId);

  const toggleQuestion = (qid: string) => {
    setSelectedQIds((prev) => {
      const next = new Set(prev);
      if (next.has(qid)) next.delete(qid);
      else next.add(qid);
      return next;
    });
  };

  const selectAllQuestions = () => {
    if (selectedQIds.size === questions.length) {
      setSelectedQIds(new Set());
    } else {
      setSelectedQIds(new Set(questions.map((q) => q.id)));
    }
  };

  const runImport = async () => {
    if (!selectedTryoutId || selectedQIds.size === 0) {
      setImportNotice("Pilih minimal satu soal.");
      return;
    }
    const title = selectedTryout?.title ?? "Tryout";
    const t = selectedTryout;
    let levelId = t?.levelId?.trim() || null;
    let levelName = t?.levelName?.trim() || null;
    let subjectId = t?.subjectId?.trim() || null;
    let subjectName = t?.subjectName?.trim() || null;
    if (levelId && !levelName) levelName = levelById.get(levelId)?.name ?? null;
    if (subjectId && !subjectName) subjectName = subjectNameById.get(subjectId) ?? null;
    const importCtx =
      levelId || subjectId || levelName || subjectName
        ? { levelId, levelName, subjectId, subjectName }
        : null;

    const toAdd = questions
      .filter((q) => selectedQIds.has(q.id))
      .map((q) => buildBankEntryFromQuestion(q, selectedTryoutId, title, importCtx));
    setImportBusy(true);
    setImportNotice(null);
    try {
      const r = await appendQuestionBankEntries(toAdd);
      const msg = `Berhasil: ${r.added} ditambahkan${r.skipped > 0 ? `, ${r.skipped} sudah ada di bank (dilewati)` : ""}.`;
      setImportNotice(msg);
      await loadBank();
      setSelectedQIds(new Set());
      showSuccess(msg);
    } catch (e) {
      setImportNotice(getFriendlyApiErrorMessage(e));
    } finally {
      setImportBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus soal ini dari bank?")) return;
    try {
      await deleteQuestionBankEntry(id);
      await loadBank();
      showSuccess("Soal berhasil dihapus dari bank.");
    } catch (e) {
      setError(getFriendlyApiErrorMessage(e));
    }
  };

  return (
    <div className="px-4 py-5 text-zinc-900 [color-scheme:light] sm:px-6 md:px-8 md:py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between md:mb-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Manage</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
            Bank soal
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-600">
            Kumpulan salinan soal dari tryout. Impor dari menu di bawah; data disimpan di{" "}
            <code className="rounded bg-zinc-100 px-1 text-xs">data/question-bank.json</code> (server). Untuk
            deployment read-only, nanti bisa dipindah ke API backend.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => {
              setAiGenTryoutId(selectedTryoutId || tryouts[0]?.id || "");
              setAiGenOpen(true);
            }}
            disabled={metaLoading || tryouts.length === 0}
            className="rounded-lg border border-violet-300 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-950 hover:bg-violet-100 disabled:opacity-50"
          >
            Generate soal (AI)
          </button>
          <button
            type="button"
            onClick={() => void openImport()}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Impor dari tryout
          </button>
        </div>
      </div>

      {notice && (
        <div className="mb-4">
          <FlashNoticeBar kind={notice.kind} message={notice.text} onDismiss={clearNotice} />
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <p className="text-sm text-zinc-600">Memuat bank soal…</p>
      ) : entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/80 px-6 py-12 text-center">
          <p className="text-sm font-medium text-zinc-800">Bank masih kosong</p>
          <p className="mt-1 text-sm text-zinc-500">
            Klik <strong>Impor dari tryout</strong>, pilih event, lalu centang soal yang ingin dimasukkan.
          </p>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/80 px-6 py-10 text-center">
          <p className="text-sm font-medium text-amber-950">Tidak ada soal untuk filter ini</p>
          <p className="mt-1 text-sm text-amber-900/80">Sesuaikan jenjang atau bidang, atau setel kembali ke &quot;Semua&quot;.</p>
          <button
            type="button"
            onClick={() => {
              setFilterLevelId("");
              setFilterSubjectId("");
            }}
            className="mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Reset filter
          </button>
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="min-w-[200px] flex-1">
              <label htmlFor="qb-filter-level" className="mb-1 block text-xs font-medium text-zinc-700">
                Jenjang pendidikan
              </label>
              <select
                id="qb-filter-level"
                value={filterLevelId}
                onChange={(ev) => {
                  setFilterLevelId(ev.target.value);
                }}
                disabled={metaLoading}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 disabled:opacity-60"
              >
                <option value="">Semua jenjang</option>
                {levels.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-[220px] flex-1">
              <label htmlFor="qb-filter-subject" className="mb-1 block text-xs font-medium text-zinc-700">
                Bidang
              </label>
              <select
                id="qb-filter-subject"
                value={filterSubjectId}
                onChange={(ev) => setFilterSubjectId(ev.target.value)}
                disabled={metaLoading || (Boolean(filterLevelId) && subjectSelectOptions.length === 0)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 disabled:opacity-60"
              >
                <option value="">Semua bidang{filterLevelId ? " (jenjang ini)" : ""}</option>
                {subjectSelectOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            {(filterLevelId || filterSubjectId) && (
              <button
                type="button"
                onClick={() => {
                  setFilterLevelId("");
                  setFilterSubjectId("");
                }}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 sm:mb-0"
              >
                Reset
              </button>
            )}
            <div className="flex w-full flex-wrap gap-2 border-t border-zinc-200 pt-3 sm:ml-auto sm:w-auto sm:border-0 sm:pt-0">
              <span className="self-center text-xs font-medium text-zinc-500">Tampilan:</span>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  viewMode === "list"
                    ? "bg-zinc-900 text-white"
                    : "border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50"
                }`}
              >
                Daftar
              </button>
              <button
                type="button"
                onClick={() => setViewMode("osk")}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  viewMode === "osk"
                    ? "bg-zinc-900 text-white"
                    : "border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50"
                }`}
              >
                Latihan (gaya OSK)
              </button>
            </div>
          </div>

          {viewMode === "osk" ? (
            <>
              <QuestionBankOskPracticeView
                key={oskRows.map((r) => r.entry.id).join("|")}
                rows={oskRows}
                coverTitle="Bank soal"
                coverSubtitle="Pratinjau set soal ala dokumen OSK — dari data bank yang sama dengan tampilan daftar."
                coverPills={oskCoverPills}
                pageHint={oskPageHint}
              />
              {filteredEntries.length > PAGE_SIZE && (
                <div className="mt-6">
                  <Pagination
                    currentPage={page}
                    totalItems={filteredEntries.length}
                    onPageChange={setPage}
                    label="soal"
                  />
                </div>
              )}
            </>
          ) : null}

          {viewMode === "list" ? (
            <>
          <ul className="space-y-3">
            {paginated.map((e) => {
              const tMeta = tryoutById[e.sourceTryoutId];
              const lid = (e.levelId ?? tMeta?.levelId ?? "").trim() || null;
              const sid = (e.subjectId ?? tMeta?.subjectId ?? "").trim() || null;
              const levelLabel =
                e.levelName?.trim() ||
                tMeta?.levelName?.trim() ||
                (lid ? levelById.get(lid)?.name : null) ||
                null;
              const subjectLabel =
                e.subjectName?.trim() ||
                tMeta?.subjectName?.trim() ||
                (sid ? subjectNameById.get(sid) : null) ||
                null;

              return (
                <li
                  key={bankEntryListKey(e)}
                  className="rounded-xl border border-zinc-200 bg-white p-4 text-zinc-900 shadow-sm"
                >
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                  <div className="min-w-0 flex-1 text-zinc-900">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-600">
                      <span className="rounded bg-zinc-100 px-2 py-0.5 font-medium text-zinc-700">
                        {typeLabel(e.type)}
                      </span>
                      <span>Skor maks: {e.maxScore}</span>
                      {(levelLabel || subjectLabel) && (
                        <>
                          <span>·</span>
                          <span className="text-zinc-500">
                            {levelLabel && <span>Jenjang: {levelLabel}</span>}
                            {levelLabel && subjectLabel ? " · " : null}
                            {subjectLabel && <span>Bidang: {subjectLabel}</span>}
                          </span>
                        </>
                      )}
                      {e.sourceTryoutTitle && (
                        <>
                          <span>·</span>
                          <Link
                            href={`/admin/tryouts/${e.sourceTryoutId}/soal`}
                            className="text-emerald-700 underline hover:text-emerald-900"
                          >
                            {e.sourceTryoutTitle}
                          </Link>
                        </>
                      )}
                    </div>
                    <div className="mt-2 text-zinc-900">
                      <QuestionBody html={e.body} imageUrl={e.imageUrl} asPreview />
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2 self-start sm:flex-row sm:items-center">
                    <button
                      type="button"
                      onClick={() => {
                        setBankModalEntry(e);
                        setBankModalOpen(true);
                      }}
                      className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
                    >
                      Detail & edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(e.id)}
                      className="text-sm text-red-600 underline hover:text-red-800"
                    >
                      Hapus dari bank
                    </button>
                  </div>
                </div>
                </li>
              );
            })}
          </ul>
          {filteredEntries.length > PAGE_SIZE && (
            <div className="mt-6">
              <Pagination
                currentPage={page}
                totalItems={filteredEntries.length}
                onPageChange={setPage}
                label="soal"
              />
            </div>
          )}
            </>
          ) : null}
        </>
      )}

      {aiGenOpen && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-4 [color-scheme:light]">
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-zinc-100 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">Generate soal AI</h2>
                <p className="mt-1 text-xs text-zinc-600">
                  Soal dibuat di tryout backend, lalu disalin ke bank soal (opsional di bawah).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAiGenOpen(false)}
                className="rounded-lg px-2 py-1 text-sm text-zinc-700 hover:bg-zinc-100"
                aria-label="Tutup"
              >
                ✕
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {tryouts.length === 0 ? (
                <p className="text-sm text-zinc-600">Belum ada tryout. Buat sesi tryout dulu di menu Tryout.</p>
              ) : (
                <>
                  <label className="block text-xs font-medium text-zinc-700">Tryout tujuan</label>
                  <select
                    value={aiGenTryoutId}
                    onChange={(e) => setAiGenTryoutId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
                  >
                    {tryouts.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                  <div className="mt-4">
                    <AiGenerateToTryoutBlock
                      tryoutId={aiGenTryoutId}
                      tryoutHint={tryoutById[aiGenTryoutId]?.title}
                      importCtx={bankImportCtxForAi}
                      onDone={() => void loadBank()}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <QuestionBankEntryModal
        entry={bankModalEntry}
        open={bankModalOpen}
        onClose={() => {
          setBankModalOpen(false);
          setBankModalEntry(null);
        }}
        onSaved={() => {
          void loadBank();
          showSuccess("Perubahan soal berhasil disimpan.");
        }}
      />

      {importOpen && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-4 [color-scheme:light]">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-zinc-200 bg-white text-zinc-900 shadow-xl">
            <div className="flex items-start justify-between border-b border-zinc-100 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">Impor dari tryout</h2>
                <p className="mt-1 text-xs text-zinc-600">
                  Pilih tryout, lalu centang soal yang akan disalin ke bank (duplikat tryout+soal dilewati otomatis).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setImportOpen(false)}
                className="rounded-lg px-2 py-1 text-sm text-zinc-700 hover:bg-zinc-100"
                aria-label="Tutup"
              >
                ✕
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {importNotice && (
                <div
                  className={`mb-3 rounded-lg border px-3 py-2 text-sm ${
                    importNotice.startsWith("Berhasil")
                      ? "border-emerald-200 bg-emerald-50 text-emerald-950"
                      : "border-amber-200 bg-amber-50 text-amber-950"
                  }`}
                >
                  {importNotice}
                </div>
              )}

              <label className="mb-1 block text-xs font-medium text-zinc-800">Tryout / event</label>
              {tryoutsLoading ? (
                <p className="mt-2 text-sm text-zinc-600">Memuat daftar tryout…</p>
              ) : (
                <select
                  value={selectedTryoutId}
                  onChange={(ev) => {
                    const v = ev.target.value;
                    setSelectedTryoutId(v);
                    void loadQuestionsForTryout(v);
                  }}
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
                >
                  <option value="" className="text-zinc-900">
                    — Pilih tryout —
                  </option>
                  {tryouts.map((t) => (
                    <option key={t.id} value={t.id} className="text-zinc-900">
                      {t.title} ({t.questionsCount} soal)
                    </option>
                  ))}
                </select>
              )}

              {selectedTryoutId && (
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-700">
                      Soal di tryout ini
                    </p>
                    {questions.length > 0 && (
                      <button
                        type="button"
                        onClick={selectAllQuestions}
                        className="text-xs font-medium text-zinc-800 underline"
                      >
                        {selectedQIds.size === questions.length ? "Batal pilih semua" : "Pilih semua"}
                      </button>
                    )}
                  </div>
                  {questionsLoading ? (
                    <p className="text-sm text-zinc-600">Memuat soal…</p>
                  ) : questions.length === 0 ? (
                    <p className="text-sm text-zinc-600">Tidak ada soal di tryout ini.</p>
                  ) : (
                    <ul className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-zinc-200 bg-zinc-100/80 p-2">
                      {questions.map((q) => (
                        <li key={`${q.tryoutSessionId}-${q.id}-${q.sortOrder}`}>
                          <label className="flex cursor-pointer gap-2 rounded-md border border-zinc-200 bg-white px-2 py-2 text-zinc-900 hover:border-zinc-300 hover:bg-zinc-50">
                            <input
                              type="checkbox"
                              checked={selectedQIds.has(q.id)}
                              onChange={() => toggleQuestion(q.id)}
                              className="mt-1 h-4 w-4 shrink-0 border-zinc-400 text-zinc-900 accent-zinc-900"
                            />
                            <div className="min-w-0 flex-1 text-zinc-900">
                              <span className="block text-xs font-medium text-zinc-700">
                                {typeLabel(q.type)}
                              </span>
                              <QuestionBody
                                html={q.body}
                                imageUrl={q.imageUrl}
                                asPreview
                                className="!text-xs !text-zinc-900"
                              />
                            </div>
                          </label>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-zinc-100 px-5 py-3">
              <button
                type="button"
                onClick={() => setImportOpen(false)}
                className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Tutup
              </button>
              <button
                type="button"
                disabled={importBusy || selectedQIds.size === 0 || !selectedTryoutId}
                onClick={() => void runImport()}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                {importBusy ? "Mengimpor…" : `Tambahkan ke bank (${selectedQIds.size})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
