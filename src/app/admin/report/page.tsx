"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  aiCreateSubscription,
  aiGenerateQuestions,
  aiGetAnalysis,
  aiGetRanking,
  aiListQuestions,
  getFriendlyApiErrorMessage,
} from "@/lib/api";
import type { AiAnalysisResponse, AiQuestionItem, RankingEntry } from "@/lib/api-types";

export default function AdminReportPage() {
  const [globalError, setGlobalError] = useState("");

  const [rankingLimit, setRankingLimit] = useState(20);
  const [rankingRows, setRankingRows] = useState<RankingEntry[]>([]);
  const [rankingLoading, setRankingLoading] = useState(false);

  const [analysisTopic, setAnalysisTopic] = useState("graph");
  const [analysisGrade, setAnalysisGrade] = useState("smp");
  const [analysisData, setAnalysisData] = useState<AiAnalysisResponse | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const [listSubject, setListSubject] = useState("math");
  const [listGrade, setListGrade] = useState("smp");
  const [listTopic, setListTopic] = useState("graph");
  const [listDifficulty, setListDifficulty] = useState("medium");
  const [listLimit, setListLimit] = useState(15);
  const [questionRows, setQuestionRows] = useState<AiQuestionItem[]>([]);
  const [listLoading, setListLoading] = useState(false);

  const [genSubject, setGenSubject] = useState("math");
  const [genGrade, setGenGrade] = useState("smp");
  const [genTopic, setGenTopic] = useState("graph");
  const [genDifficulty, setGenDifficulty] = useState("olympiad");
  const [genCount, setGenCount] = useState(5);
  const [generatedRows, setGeneratedRows] = useState<AiQuestionItem[]>([]);
  const [generateLoading, setGenerateLoading] = useState(false);

  const [planCode, setPlanCode] = useState("pro_monthly");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [submittingSub, setSubmittingSub] = useState(false);
  const [subMessage, setSubMessage] = useState("");

  async function loadRanking(limit = rankingLimit) {
    setRankingLoading(true);
    setGlobalError("");
    try {
      const rows = await aiGetRanking(limit);
      setRankingRows(rows);
    } catch (err) {
      setGlobalError(getFriendlyApiErrorMessage(err));
    } finally {
      setRankingLoading(false);
    }
  }

  useEffect(() => {
    void loadRanking(20);
  }, []);

  const rankingSummary = useMemo(() => {
    if (rankingRows.length === 0) return { avgScore: 0, avgAcc: 0 };
    const totalScore = rankingRows.reduce((acc, item) => acc + (item.score || 0), 0);
    const totalAcc = rankingRows.reduce((acc, item) => acc + (item.accuracyPct || 0), 0);
    return {
      avgScore: totalScore / rankingRows.length,
      avgAcc: totalAcc / rankingRows.length,
    };
  }, [rankingRows]);

  async function handleLoadAnalysis(e: FormEvent) {
    e.preventDefault();
    setAnalysisLoading(true);
    setGlobalError("");
    try {
      const data = await aiGetAnalysis({ topic: analysisTopic, grade: analysisGrade });
      setAnalysisData(data);
    } catch (err) {
      setGlobalError(getFriendlyApiErrorMessage(err));
    } finally {
      setAnalysisLoading(false);
    }
  }

  async function handleListQuestions(e: FormEvent) {
    e.preventDefault();
    setListLoading(true);
    setGlobalError("");
    try {
      const data = await aiListQuestions({
        subject: listSubject,
        grade: listGrade,
        topic: listTopic,
        difficulty: listDifficulty,
        limit: listLimit,
      });
      setQuestionRows(data);
    } catch (err) {
      setGlobalError(getFriendlyApiErrorMessage(err));
    } finally {
      setListLoading(false);
    }
  }

  async function handleGenerate(e: FormEvent) {
    e.preventDefault();
    setGenerateLoading(true);
    setGlobalError("");
    try {
      const data = await aiGenerateQuestions({
        subject: genSubject,
        grade: genGrade,
        topic: genTopic,
        difficulty: genDifficulty,
        count: genCount,
      });
      setGeneratedRows(data);
    } catch (err) {
      setGlobalError(getFriendlyApiErrorMessage(err));
    } finally {
      setGenerateLoading(false);
    }
  }

  function toIso(localValue: string): string {
    const raw = localValue.trim();
    if (!raw) return "";
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString();
  }

  async function handleCreateSubscription(e: FormEvent) {
    e.preventDefault();
    const startIso = toIso(startAt);
    const endIso = toIso(endAt);
    setSubmittingSub(true);
    setSubMessage("");
    setGlobalError("");
    try {
      const created = await aiCreateSubscription({
        planCode: planCode.trim(),
        ...(startIso ? { startAt: startIso } : {}),
        ...(endIso ? { endAt: endIso } : {}),
      });
      setSubMessage(`Subscription aktif: ${created.planCode} (${created.status})`);
    } catch (err) {
      setSubMessage(getFriendlyApiErrorMessage(err));
    } finally {
      setSubmittingSub(false);
    }
  }

  return (
    <div className="px-4 py-5 text-zinc-900 sm:px-6 md:px-8 md:py-8">
      <div className="mb-6 md:mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Report
        </p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
          AI Engine Admin Console
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Monitoring ranking nasional, analisis topik, eksplorasi bank soal AI, dan aktivasi
          subscription.
        </p>
      </div>

      {globalError ? (
        <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {globalError}
        </div>
      ) : null}

      <section className="mb-8 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold text-zinc-900">Bank Soal (Seed)</h2>
        <p className="text-sm text-zinc-600">
          CRUD khusus admin untuk `ai_questions` belum tersedia. Seeding awal dilakukan via SQL/DB
          tool, lalu data bisa dipantau dari modul ranking dan list soal di halaman ini.
        </p>
      </section>

      <section className="mb-8 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-zinc-900">Ranking Nasional</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void loadRanking(rankingLimit);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="number"
              min={1}
              max={100}
              value={rankingLimit}
              onChange={(e) => setRankingLimit(Math.max(1, Number(e.target.value) || 20))}
              className="w-24 rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={rankingLoading}
              className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
            >
              {rankingLoading ? "Memuat..." : "Refresh"}
            </button>
          </form>
        </div>
        <div className="mb-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm">
            Rata-rata skor: <span className="font-semibold">{rankingSummary.avgScore.toFixed(1)}</span>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm">
            Rata-rata akurasi:{" "}
            <span className="font-semibold">{rankingSummary.avgAcc.toFixed(1)}%</span>
          </div>
        </div>
        <div className="overflow-x-auto rounded-xl border border-zinc-200">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-zinc-600">User ID</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-600">Score</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-600">Akurasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {rankingRows.map((row) => (
                <tr key={`${row.userId}-${row.score}`}>
                  <td className="px-3 py-2">{row.userId}</td>
                  <td className="px-3 py-2">{row.score}</td>
                  <td className="px-3 py-2">{row.accuracyPct ?? 0}%</td>
                </tr>
              ))}
              {!rankingRows.length && !rankingLoading ? (
                <tr>
                  <td className="px-3 py-4 text-zinc-500" colSpan={3}>
                    Belum ada data ranking.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-8 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">Analisis Topik</h2>
        <form onSubmit={handleLoadAnalysis} className="mb-4 grid gap-2 sm:grid-cols-4">
          <input
            value={analysisTopic}
            onChange={(e) => setAnalysisTopic(e.target.value)}
            placeholder="topic (graph)"
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
          <input
            value={analysisGrade}
            onChange={(e) => setAnalysisGrade(e.target.value)}
            placeholder="grade (smp)"
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={analysisLoading}
            className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
          >
            {analysisLoading ? "Memuat..." : "Ambil analisis"}
          </button>
        </form>
        {analysisData ? (
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <div className="rounded-lg bg-zinc-50 px-3 py-2">Akurasi: {analysisData.accuracyPercent}%</div>
            <div className="rounded-lg bg-zinc-50 px-3 py-2">Total attempt: {analysisData.totalAttempts}</div>
            <div className="rounded-lg bg-zinc-50 px-3 py-2">Benar: {analysisData.correctAttempts}</div>
            <div className="rounded-lg bg-zinc-50 px-3 py-2">Rata-rata waktu: {analysisData.avgTimeMs} ms</div>
            <div className="rounded-lg bg-zinc-50 px-3 py-2">Weak topic: {analysisData.weakTopic ?? "-"}</div>
            <div className="rounded-lg bg-zinc-50 px-3 py-2">
              Rekomendasi: {analysisData.recommendations?.length ?? 0} soal
            </div>
          </div>
        ) : null}
      </section>

      <section className="mb-8 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">Eksplorasi Bank Soal AI</h2>
        <form onSubmit={handleListQuestions} className="mb-4 grid gap-2 sm:grid-cols-5">
          <input value={listSubject} onChange={(e) => setListSubject(e.target.value)} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm" />
          <input value={listGrade} onChange={(e) => setListGrade(e.target.value)} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm" />
          <input value={listTopic} onChange={(e) => setListTopic(e.target.value)} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm" />
          <input value={listDifficulty} onChange={(e) => setListDifficulty(e.target.value)} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm" />
          <input type="number" min={1} max={100} value={listLimit} onChange={(e) => setListLimit(Math.max(1, Number(e.target.value) || 15))} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm" />
          <button type="submit" disabled={listLoading} className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60">
            {listLoading ? "Memuat..." : "Cari soal"}
          </button>
        </form>
        <p className="mb-2 text-xs text-zinc-600">Hasil: {questionRows.length} soal</p>
        <div className="space-y-2">
          {questionRows.slice(0, 5).map((q) => (
            <div key={q.id} className="rounded-xl border border-zinc-200 px-3 py-2 text-sm">
              <p className="font-medium">{q.questionText}</p>
              <p className="mt-1 text-xs text-zinc-600">
                {q.subject} / {q.grade} / {q.topic} / {q.difficulty}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">Generate Soal Baru</h2>
        <form onSubmit={handleGenerate} className="mb-4 grid gap-2 sm:grid-cols-5">
          <input value={genSubject} onChange={(e) => setGenSubject(e.target.value)} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm" />
          <input value={genGrade} onChange={(e) => setGenGrade(e.target.value)} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm" />
          <input value={genTopic} onChange={(e) => setGenTopic(e.target.value)} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm" />
          <input value={genDifficulty} onChange={(e) => setGenDifficulty(e.target.value)} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm" />
          <input type="number" min={1} max={50} value={genCount} onChange={(e) => setGenCount(Math.max(1, Number(e.target.value) || 5))} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm" />
          <button type="submit" disabled={generateLoading} className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60">
            {generateLoading ? "Generating..." : "Generate"}
          </button>
        </form>
        <p className="mb-2 text-xs text-zinc-600">Terbuat: {generatedRows.length} soal</p>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">Aktivasi Subscription</h2>
        <form onSubmit={handleCreateSubscription} className="grid gap-2 sm:grid-cols-4">
          <input
            value={planCode}
            onChange={(e) => setPlanCode(e.target.value)}
            placeholder="pro_monthly"
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
          <input
            type="datetime-local"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
          <input
            type="datetime-local"
            value={endAt}
            onChange={(e) => setEndAt(e.target.value)}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={submittingSub}
            className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
          >
            {submittingSub ? "Menyimpan..." : "Aktifkan"}
          </button>
        </form>
        <p className="mt-2 text-xs text-zinc-500">
          Bisa kirim `planCode` saja, atau sertakan tanggal mulai/selesai jika perlu override
          periode.
        </p>
        {subMessage ? <p className="mt-2 text-sm text-zinc-700">{subMessage}</p> : null}
      </section>
    </div>
  );
}
