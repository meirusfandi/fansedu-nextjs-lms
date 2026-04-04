"use client";

import {
  adminGetCourseManage,
  adminGetCourseProgram,
  adminPutCourseLinkedTryouts,
  adminPutCourseProgram,
  getFriendlyApiErrorMessage,
} from "@/lib/api";
import type { CourseMeeting, CourseProgramPayload, CourseTrackType } from "@/lib/api-types";
import { useCallback, useEffect, useState } from "react";

function parseTryoutIdLines(text: string): string[] {
  return text
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function emptyMeetingRow(meetingNumber: number): CourseMeeting {
  return {
    meetingNumber,
    title: "",
    detailText: "",
    pdfUrl: "",
    prTitle: "",
    prDescription: "",
    liveClassUrl: "",
  };
}

type Props = {
  open: boolean;
  courseId: string;
  courseTitle: string;
  onClose: () => void;
  onSaved: () => void;
};

export function CourseProgramModal({ open, courseId, courseTitle, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [trackType, setTrackType] = useState<CourseTrackType>("meetings");
  const [meetings, setMeetings] = useState<CourseMeeting[]>(() =>
    Array.from({ length: 8 }, (_, i) => emptyMeetingRow(i + 1))
  );
  const [pretestTryoutSessionId, setPretestTryoutSessionId] = useState("");
  const [linkedTryoutIdsText, setLinkedTryoutIdsText] = useState("");

  const load = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const p = await adminGetCourseProgram(courseId);
      setTrackType(p.trackType);
      const byNum = new Map(p.meetings.map((m) => [m.meetingNumber, m]));
      setMeetings(
        Array.from({ length: 8 }, (_, i) => {
          const n = i + 1;
          return byNum.get(n) ? { ...byNum.get(n)!, meetingNumber: n } : emptyMeetingRow(n);
        })
      );
      setPretestTryoutSessionId(p.pretestTryoutSessionId?.trim() ?? "");
      let linkedText = "";
      try {
        const manage = await adminGetCourseManage(courseId);
        const c = manage.course as { linkedTryoutIds?: string[] } | undefined;
        const ids = c?.linkedTryoutIds;
        if (Array.isArray(ids) && ids.length > 0) linkedText = ids.join("\n");
      } catch {
        /* manage opsional */
      }
      setLinkedTryoutIdsText(linkedText);
    } catch (e) {
      setError(getFriendlyApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (open && courseId) void load();
  }, [open, courseId, load]);

  const updateMeeting = (index: number, patch: Partial<CourseMeeting>) => {
    setMeetings((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const linkedIds = parseTryoutIdLines(linkedTryoutIdsText);
      if (trackType === "tryout") {
        await adminPutCourseLinkedTryouts(courseId, { linkedTryoutIds: linkedIds });
      }
      const payload: CourseProgramPayload = {
        trackType,
        meetings,
        pretestTryoutSessionId: pretestTryoutSessionId.trim()
          ? pretestTryoutSessionId.trim()
          : null,
      };
      const res = await adminPutCourseProgram(courseId, payload);
      setNotice(res?.message ?? "Program tersimpan; learning journey diperbarui.");
      onSaved();
    } catch (err) {
      setError(getFriendlyApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border border-zinc-200 bg-white shadow-xl">
        <div className="flex shrink-0 items-start justify-between border-b border-zinc-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Program kelas</h2>
            <p className="mt-0.5 text-sm text-zinc-600">{courseTitle}</p>
            <p className="mt-1 text-xs text-amber-800">
              Menyimpan program membangun ulang section/lesson siswa. Progress lesson bisa terpengaruh jika ID lesson
              berubah.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {error && (
              <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            {notice && (
              <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                {notice}
              </div>
            )}

            {loading ? (
              <p className="text-sm text-zinc-500">Memuat program…</p>
            ) : (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-zinc-600">Tipe jalur (track)</label>
                  <select
                    value={trackType}
                    onChange={(e) => setTrackType(e.target.value as CourseTrackType)}
                    className="mt-1 w-full max-w-xs rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
                  >
                    <option value="meetings">Pertemuan (1–8, PDF, PR, live)</option>
                    <option value="tryout">Tryout (latihan terhubung)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-600">
                    Pre-test (UUID sesi tryout, opsional)
                  </label>
                  <input
                    type="text"
                    value={pretestTryoutSessionId}
                    onChange={(e) => setPretestTryoutSessionId(e.target.value)}
                    placeholder="contoh: uuid sesi tryout yang sudah ada"
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-sm"
                  />
                </div>

                {trackType === "tryout" && (
                  <div>
                    <label className="block text-xs font-medium text-zinc-600">
                      Tryout terhubung — satu UUID per baris (urutan = urutan latihan)
                    </label>
                    <textarea
                      rows={4}
                      value={linkedTryoutIdsText}
                      onChange={(e) => setLinkedTryoutIdsText(e.target.value)}
                      placeholder="uuid-1&#10;uuid-2"
                      className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-sm"
                    />
                    <p className="mt-1 text-xs text-zinc-500">
                      Jika backend mengembalikan linked tryout di GET manage, daftar diisi otomatis. Simpan untuk
                      memperbarui urutan (PUT linked-tryouts lalu PUT program).
                    </p>
                  </div>
                )}

                {trackType === "meetings" && (
                  <div className="space-y-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Pertemuan 1–8</p>
                    {meetings.map((m, idx) => (
                      <details
                        key={m.meetingNumber}
                        className="rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-2"
                        open={idx === 0}
                      >
                        <summary className="cursor-pointer text-sm font-medium text-zinc-900">
                          Pertemuan {m.meetingNumber}
                          {m.title ? ` — ${m.title}` : ""}
                        </summary>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <div className="sm:col-span-2">
                            <label className="text-xs text-zinc-600">Judul</label>
                            <input
                              type="text"
                              value={m.title ?? ""}
                              onChange={(e) => updateMeeting(idx, { title: e.target.value })}
                              className="mt-0.5 w-full rounded border border-zinc-200 bg-white px-2 py-1.5 text-sm"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="text-xs text-zinc-600">Detail (teks)</label>
                            <textarea
                              rows={2}
                              value={m.detailText ?? ""}
                              onChange={(e) => updateMeeting(idx, { detailText: e.target.value })}
                              className="mt-0.5 w-full rounded border border-zinc-200 bg-white px-2 py-1.5 text-sm"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="text-xs text-zinc-600">URL PDF materi</label>
                            <input
                              type="url"
                              value={m.pdfUrl ?? ""}
                              onChange={(e) => updateMeeting(idx, { pdfUrl: e.target.value })}
                              className="mt-0.5 w-full rounded border border-zinc-200 bg-white px-2 py-1.5 text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-zinc-600">Judul PR</label>
                            <input
                              type="text"
                              value={m.prTitle ?? ""}
                              onChange={(e) => updateMeeting(idx, { prTitle: e.target.value })}
                              className="mt-0.5 w-full rounded border border-zinc-200 bg-white px-2 py-1.5 text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-zinc-600">Deskripsi PR</label>
                            <input
                              type="text"
                              value={m.prDescription ?? ""}
                              onChange={(e) => updateMeeting(idx, { prDescription: e.target.value })}
                              className="mt-0.5 w-full rounded border border-zinc-200 bg-white px-2 py-1.5 text-sm"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="text-xs text-zinc-600">Link kelas live</label>
                            <input
                              type="url"
                              value={m.liveClassUrl ?? ""}
                              onChange={(e) => updateMeeting(idx, { liveClassUrl: e.target.value })}
                              className="mt-0.5 w-full rounded border border-zinc-200 bg-white px-2 py-1.5 text-sm"
                            />
                          </div>
                        </div>
                      </details>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex shrink-0 justify-end gap-2 border-t border-zinc-100 px-5 py-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading || saving}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
            >
              Muat ulang
            </button>
            <button
              type="submit"
              disabled={loading || saving}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {saving ? "Menyimpan…" : "Simpan program"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
