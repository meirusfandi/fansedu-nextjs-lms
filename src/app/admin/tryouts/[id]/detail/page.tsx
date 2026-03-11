"use client";

import { AdminSidebar } from "@/components/AdminSidebar";
import { QuestionBody } from "@/components/QuestionBody";
import {
  adminGetTryout,
  adminListTryoutQuestions,
  adminGetQuestionStats,
  adminGetAllQuestionStats,
  getTryoutLeaderboard,
  logout,
  clearAuthToken,
} from "@/lib/api";
import type { LeaderboardEntry, Question, TryoutSession } from "@/lib/api-types";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const LEVEL_LABEL: Record<string, string> = {
  easy: "Mudah",
  medium: "Menengah",
  hard: "Sulit",
};
const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  open: "Dibuka",
  closed: "Ditutup",
};
const TYPE_LABEL: Record<string, string> = {
  short: "Isian singkat",
  multiple_choice: "Pilihan ganda",
  true_false: "Benar/Salah",
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

/** Blok detail statistik per soal: jumlah siswa mengerjakan, benar, salah, dan bar visual. */
function QuestionStatsBlock({
  stats,
  participantsFallback,
}: {
  stats: Awaited<ReturnType<typeof adminGetQuestionStats>>;
  participantsFallback: number;
}) {
  const peserta = stats?.participants_count ?? stats?.answered_count ?? (participantsFallback > 0 ? participantsFallback : null);
  const benar = stats?.correct_count ?? 0;
  const salah = stats?.wrong_count ?? 0;
  const totalJawaban = benar + salah;
  const pctBenar = totalJawaban > 0 ? Math.round((benar / totalJawaban) * 100) : 0;
  const pctSalah = totalJawaban > 0 ? Math.round((salah / totalJawaban) * 100) : 0;
  const fromBackend = stats != null && (stats.participants_count != null || stats.answered_count != null || stats.correct_count != null || stats.wrong_count != null);

  return (
    <div className="mt-3 rounded-lg border border-zinc-200 bg-white p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
        Detail statistik soal
      </p>
      <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs text-zinc-500">Jumlah siswa yang mengerjakan soal ini</p>
          <p className="font-semibold text-zinc-900">{peserta ?? "–"}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">Jumlah jawaban benar</p>
          <p className="font-semibold text-emerald-700">
            {totalJawaban > 0 ? `${benar} (${pctBenar}%)` : "–"}
          </p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">Jumlah jawaban salah</p>
          <p className="font-semibold text-red-700">
            {totalJawaban > 0 ? `${salah} (${pctSalah}%)` : "–"}
          </p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">Total jawaban</p>
          <p className="font-semibold text-zinc-900">{totalJawaban > 0 ? totalJawaban : "–"}</p>
        </div>
      </div>
      {totalJawaban > 0 && (
        <div className="mt-3">
          <p className="mb-1 text-xs text-zinc-500">Perbandingan benar vs salah</p>
          <div className="flex h-6 w-full overflow-hidden rounded-full bg-zinc-100">
            <div
              className="bg-emerald-500 transition-all"
              style={{ width: `${pctBenar}%` }}
              title={`Benar ${pctBenar}%`}
            />
            <div
              className="bg-red-500 transition-all"
              style={{ width: `${pctSalah}%` }}
              title={`Salah ${pctSalah}%`}
            />
          </div>
        </div>
      )}
      {!fromBackend && peserta != null && (
        <p className="mt-2 text-[11px] text-zinc-400">
          Jumlah peserta dari leaderboard. Untuk angka benar/salah per soal, sambungkan endpoint GET /admin/tryouts/:id/questions/:questionId/stats di backend.
        </p>
      )}
    </div>
  );
}

type QuestionWithStats = Question & { stats: Awaited<ReturnType<typeof adminGetQuestionStats>> };

export default function AdminTryoutDetailPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const tryoutId = params?.id as string | undefined;

  const [tryout, setTryout] = useState<TryoutSession | null>(null);
  const [questions, setQuestions] = useState<QuestionWithStats[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
  const handleLogout = useCallback(() => {
    logout().catch(() => {});
    clearAuthToken();
    router.push("/login");
  }, [router]);

  const loadData = useCallback(async () => {
    if (!tryoutId) return;
    setLoading(true);
    setError(null);
    try {
      const [tryoutRes, questionsRes, leaderboardRes] = await Promise.all([
        adminGetTryout(tryoutId).catch(() => null),
        adminListTryoutQuestions(tryoutId),
        getTryoutLeaderboard(tryoutId).catch(() => []),
      ]);
      setTryout(tryoutRes);
      setLeaderboard(Array.isArray(leaderboardRes) ? leaderboardRes : []);
      const qList = Array.isArray(questionsRes) ? questionsRes : [];
      const sorted = [...qList].sort((a, b) => a.sort_order - b.sort_order);

      // Coba bulk stats dulu (satu request); kalau belum ada di backend, fallback per-soal
      const bulkStats = await adminGetAllQuestionStats(tryoutId).catch(() => null);
      const participantsCount = bulkStats?.participants_count;

      let withStats: QuestionWithStats[];
      if (bulkStats && Array.isArray(bulkStats.questions) && bulkStats.questions.length > 0) {
        const byId = new Map(
          bulkStats.questions.map((item) => [
            item.question_id,
            {
              participants_count: participantsCount,
              answered_count: item.answered_count,
              correct_count: item.correct_count,
              wrong_count: item.wrong_count,
              correct_percent: item.correct_percent,
              wrong_percent: item.wrong_percent,
            },
          ])
        );
        withStats = sorted.map((q) => ({ ...q, stats: byId.get(q.id) ?? null }));
      } else {
        withStats = await Promise.all(
          sorted.map(async (q) => {
            const stats = await adminGetQuestionStats(tryoutId, q.id).catch(() => null);
            return { ...q, stats };
          })
        );
      }
      setQuestions(withStats);
    } catch (e) {
      setError((e as Error).message ?? "Gagal memuat data");
      setQuestions([]);
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  }, [tryoutId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!tryoutId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <p className="text-sm text-zinc-500">ID tryout tidak valid.</p>
      </div>
    );
  }

  if (loading && !tryout) {
    return (
      <div className="flex min-h-screen bg-zinc-50 text-zinc-900">
        <AdminSidebar currentPath={pathname ?? ""} onLogout={handleLogout} />
        <main className="flex-1 px-4 py-8">
          <p className="text-sm text-zinc-500">Memuat detail event...</p>
        </main>
      </div>
    );
  }

  if (error && !tryout) {
    return (
      <div className="flex min-h-screen bg-zinc-50 text-zinc-900">
        <AdminSidebar currentPath={pathname ?? ""} onLogout={handleLogout} />
        <main className="flex-1 px-4 py-8">
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
          <Link href="/admin/tryouts" className="mt-4 inline-block text-sm text-zinc-600 underline">
            ← Kembali ke daftar event
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-900">
      <AdminSidebar currentPath={pathname ?? ""} onLogout={handleLogout} />
      <main className="flex-1 px-4 py-5 sm:px-6 md:px-8 md:py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/admin/tryouts" className="text-sm text-zinc-600 underline hover:text-zinc-900">
              ← Event
            </Link>
            <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
              Detail event / tryout
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              {tryout?.title ?? tryout?.short_title ?? "–"}
            </p>
          </div>
          <Link
            href={`/admin/tryouts/${tryoutId}/soal`}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Kelola Soal
          </Link>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {error}
          </div>
        )}

        {/* Info tryout */}
        {tryout && (
          <section className="mb-8 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Informasi event
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs text-zinc-500">Judul</p>
                <p className="font-medium text-zinc-900">{tryout.title}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Buka – Tutup</p>
                <p className="text-sm text-zinc-700">
                  {formatDate(tryout.opens_at)} – {formatDate(tryout.closes_at)}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Durasi / Level / Status</p>
                <p className="text-sm text-zinc-700">
                  {tryout.duration_minutes} mnt · {LEVEL_LABEL[tryout.level] ?? tryout.level} ·{" "}
                  {STATUS_LABEL[tryout.status] ?? tryout.status}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Jumlah soal</p>
                <p className="text-sm text-zinc-700">{tryout.questions_count} soal</p>
              </div>
            </div>
            {tryout.description && (
              <p className="mt-3 text-sm text-zinc-600">{tryout.description}</p>
            )}
          </section>
        )}

        {/* Leaderboard */}
        <section className="mb-8 rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <h2 className="border-b border-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-900">
            Leaderboard
          </h2>
          <div className="overflow-x-auto">
            {leaderboard.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-zinc-500">Belum ada data leaderboard.</p>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-zinc-500">Peringkat</th>
                    <th className="px-4 py-2 text-left font-medium text-zinc-500">Nama</th>
                    <th className="px-4 py-2 text-left font-medium text-zinc-500">Sekolah</th>
                    <th className="px-4 py-2 text-right font-medium text-zinc-500">Skor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {leaderboard.map((entry, i) => (
                    <tr key={entry.user_id ?? i} className="hover:bg-zinc-50/50">
                      <td className="px-4 py-2 font-medium text-zinc-900">{entry.rank ?? i + 1}</td>
                      <td className="px-4 py-2 text-zinc-700">
                        {entry.user_name ?? entry.name ?? entry.nama ?? "–"}
                      </td>
                      <td className="px-4 py-2 text-zinc-600">{entry.school_name ?? "–"}</td>
                      <td className="px-4 py-2 text-right font-medium text-zinc-900">
                        {entry.score ?? entry.skor ?? entry.best_score ?? "–"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Daftar soal + detail */}
        <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <h2 className="border-b border-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-900">
            Daftar soal ({questions.length})
          </h2>
          <div className="divide-y divide-zinc-100">
            {questions.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-zinc-500">Belum ada soal. Kelola soal untuk menambah.</p>
            ) : (
              questions.map((q) => (
                <div key={q.id} className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setExpandedQuestionId((id) => (id === q.id ? null : q.id))}
                    className="flex w-full items-center justify-between text-left"
                  >
                    <span className="font-medium text-zinc-900">
                      Soal #{q.sort_order} · {TYPE_LABEL[q.type] ?? q.type} (max {q.max_score} poin)
                    </span>
                    <span className="text-zinc-400">
                      {expandedQuestionId === q.id ? "▲" : "▼"}
                    </span>
                  </button>
                  {/* Detail statistik: dikerjakan berapa siswa, berapa benar, berapa salah */}
                  <QuestionStatsBlock
                    stats={q.stats}
                    participantsFallback={leaderboard.length}
                  />
                  {expandedQuestionId === q.id && (
                    <div className="mt-4 rounded-lg border border-zinc-100 bg-zinc-50/50 p-4">
                      <p className="mb-2 text-xs font-semibold uppercase text-zinc-500">Teks soal</p>
                      <div className="min-h-[2rem] text-sm text-zinc-900">
                        <QuestionBody html={q.body ?? ""} imageUrl={q.image_url} />
                      </div>
                      {q.options && q.options.length > 0 && (
                        <>
                          <p className="mt-3 text-xs font-semibold uppercase text-zinc-500">Opsi jawaban</p>
                          <ul className="mt-1 list-inside list-disc text-sm text-zinc-700">
                            {q.options.map((opt, i) => (
                              <li key={i}>{opt}</li>
                            ))}
                          </ul>
                        </>
                      )}
                      <p className="mt-3 text-xs text-zinc-500">
                        Tipe: {TYPE_LABEL[q.type] ?? q.type} · Max skor: {q.max_score}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
