"use client";

import { CourseProgramModal } from "@/components/admin/CourseProgramModal";
import { FlashNoticeBar, useFlashNotice } from "@/components/FlashNotice";
import { Pagination, PAGE_SIZE } from "@/components/Pagination";
import {
  adminCreateCourseUnderSubject,
  adminDeleteCourse,
  adminGetLevelSubjects,
  adminGetSubject,
  adminListCoursesBySubject,
  adminListSubjects,
  adminUpdateCourse,
  getFriendlyApiErrorMessage,
} from "@/lib/api";
import type { Course, CourseTrackType, Subject } from "@/lib/api-types";
import {
  buildOptionalProgramOnCreate,
  defaultMeetingsForForm,
  emptyModuleForm,
  type ModuleFormState,
} from "@/features/admin/kelas-helpers";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

function KelasDetailInner() {
  const { notice, showSuccess, clearNotice } = useFlashNotice();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const subjectId = String(params?.id ?? "").trim();
  const levelIdQ = searchParams.get("levelId");

  const [subject, setSubject] = useState<Subject | null>(null);
  const [subjectLoading, setSubjectLoading] = useState(true);
  const [subjectError, setSubjectError] = useState<string | null>(null);

  const [modules, setModules] = useState<Course[]>([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [modulePage, setModulePage] = useState(1);
  const [pageError, setPageError] = useState<string | null>(null);

  const [moduleForm, setModuleForm] = useState<ModuleFormState>(() => emptyModuleForm());
  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [programCourse, setProgramCourse] = useState<{ id: string; title: string } | null>(null);

  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!subjectId) {
      setSubject(null);
      setSubjectLoading(false);
      setSubjectError("ID kelas tidak valid.");
      return;
    }
    let cancelled = false;
    (async () => {
      setSubjectLoading(true);
      setSubjectError(null);
      try {
        let s = await adminGetSubject(subjectId);
        if (!s && levelIdQ) {
          const list = await adminGetLevelSubjects(levelIdQ);
          s = list.find((x) => x.id === subjectId) ?? null;
        }
        if (!s) {
          const all = await adminListSubjects();
          s = all.find((x) => x.id === subjectId) ?? null;
        }
        if (!cancelled) {
          setSubject(s);
          if (!s) setSubjectError("Kelas tidak ditemukan.");
        }
      } catch (e) {
        if (!cancelled) {
          setSubject(null);
          setSubjectError(getFriendlyApiErrorMessage(e));
        }
      } finally {
        if (!cancelled) setSubjectLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [subjectId, levelIdQ]);

  const loadModules = useCallback(async () => {
    if (!subjectId) return;
    setModulesLoading(true);
    setPageError(null);
    try {
      const list = await adminListCoursesBySubject(subjectId);
      setModules(Array.isArray(list) ? list : []);
    } catch (e) {
      setPageError(getFriendlyApiErrorMessage(e));
      setModules([]);
    } finally {
      setModulesLoading(false);
    }
  }, [subjectId]);

  useEffect(() => {
    if (subject) void loadModules();
  }, [subject, loadModules]);

  useEffect(() => {
    setModulePage(1);
  }, [subjectId]);

  const paginatedModules = useMemo(() => {
    return modules.slice((modulePage - 1) * PAGE_SIZE, modulePage * PAGE_SIZE);
  }, [modules, modulePage]);

  useEffect(() => {
    if (modules.length > 0 && (modulePage - 1) * PAGE_SIZE >= modules.length) {
      setModulePage(1);
    }
  }, [modules.length, modulePage]);

  const openModuleAdd = () => {
    setModuleForm(emptyModuleForm());
    setEditingModuleId(null);
    setSubmitError(null);
    setModuleModalOpen(true);
  };

  const openModuleEdit = (c: Course) => {
    setModuleForm({
      title: c.title,
      description: c.description ?? "",
      trackType: c.trackType === "tryout" ? "tryout" : "meetings",
      pretestTryoutSessionId: "",
      linkedTryoutIdsText: "",
      meetings: defaultMeetingsForForm(),
    });
    setEditingModuleId(c.id);
    setSubmitError(null);
    setModuleModalOpen(true);
  };

  const handleModuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId) return;
    setSubmitError(null);
    setSubmitLoading(true);
    const editing = editingModuleId;
    try {
      if (editingModuleId) {
        await adminUpdateCourse(editingModuleId, {
          title: moduleForm.title.trim(),
          description: moduleForm.description.trim() || undefined,
        });
      } else {
        const programExtra = buildOptionalProgramOnCreate(moduleForm);
        await adminCreateCourseUnderSubject(subjectId, {
          title: moduleForm.title.trim(),
          description: moduleForm.description.trim() || undefined,
          ...(programExtra ?? {}),
        });
      }
      setModuleModalOpen(false);
      setEditingModuleId(null);
      await loadModules();
      showSuccess(editing ? "Modul berhasil diperbarui." : "Modul berhasil ditambahkan.");
    } catch (err) {
      setSubmitError(getFriendlyApiErrorMessage(err));
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm("Hapus modul ini?")) return;
    try {
      await adminDeleteCourse(moduleId);
      await loadModules();
      showSuccess("Modul berhasil dihapus.");
    } catch (err) {
      setPageError(getFriendlyApiErrorMessage(err));
    }
  };

  if (!subjectId) {
    return (
      <div className="px-4 py-8 text-center text-sm text-red-600">
        ID kelas tidak valid.{" "}
        <Link href="/admin/master-data/kelas" className="underline">
          Kembali ke daftar kelas
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 py-5 text-zinc-900 sm:px-6 md:px-8 md:py-8">
      {notice && (
        <div className="mb-4">
          <FlashNoticeBar kind={notice.kind} message={notice.text} onDismiss={clearNotice} />
        </div>
      )}
      <div className="mb-6">
        <Link
          href="/admin/master-data/kelas"
          className="text-sm font-medium text-zinc-600 underline decoration-zinc-300 underline-offset-2 hover:text-zinc-900"
        >
          ← Kembali ke daftar kelas
        </Link>
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Master Data</p>
        {subjectLoading ? (
          <h1 className="mt-1 text-xl font-semibold text-zinc-900">Memuat…</h1>
        ) : subject ? (
          <>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">{subject.name}</h1>
            {subject.description && <p className="mt-1 text-sm text-zinc-600">{subject.description}</p>}
            <p className="mt-2 text-sm text-zinc-500">
              Tambah dan atur modul untuk kelas ini. Program pertemuan / tryout diatur per modul lewat tombol{" "}
              <strong className="text-zinc-700">Program</strong>.
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-1 text-xl font-semibold text-zinc-900">Kelas tidak ditemukan</h1>
            {subjectError && <p className="mt-2 text-sm text-red-600">{subjectError}</p>}
          </>
        )}
      </div>

      {pageError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{pageError}</div>
      )}

      {subject && !subjectLoading && (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium text-zinc-800">Daftar modul</p>
            <button
              type="button"
              onClick={openModuleAdd}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              + Tambah modul
            </button>
          </div>

          {modulesLoading ? (
            <p className="text-sm text-zinc-500">Memuat modul…</p>
          ) : modules.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 px-4 py-8 text-center text-sm text-zinc-600">
              Belum ada modul. Klik <strong>Tambah modul</strong> untuk menambahkan isi kelas.
            </div>
          ) : (
            <>
              <ul className="space-y-2">
                {paginatedModules.map((c) => (
                  <li
                    key={c.id}
                    className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-zinc-900">{c.title}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2">
                        {c.trackType && (
                          <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-600">
                            {c.trackType === "tryout" ? "Tryout" : "Pertemuan"}
                          </span>
                        )}
                        {c.description && (
                          <p className="text-xs text-zinc-500 line-clamp-2">{c.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setProgramCourse({ id: c.id, title: c.title })}
                        className="text-xs font-medium text-emerald-700 underline hover:text-emerald-900"
                      >
                        Program
                      </button>
                      <button
                        type="button"
                        onClick={() => openModuleEdit(c)}
                        className="text-xs text-zinc-600 underline hover:text-zinc-900"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteModule(c.id)}
                        className="text-xs text-red-600 underline"
                      >
                        Hapus
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              {modules.length > PAGE_SIZE && (
                <div className="mt-4">
                  <Pagination
                    currentPage={modulePage}
                    totalItems={modules.length}
                    onPageChange={setModulePage}
                    label="modul"
                  />
                </div>
              )}
            </>
          )}
        </>
      )}

      {moduleModalOpen && subject && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-zinc-900">
              {editingModuleId ? "Edit modul" : "Tambah modul"}
            </h2>
            {submitError && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {submitError}
              </div>
            )}
            <form onSubmit={handleModuleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-600">Judul modul *</label>
                <input
                  type="text"
                  required
                  value={moduleForm.title}
                  onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                  placeholder="Mis. Minggu 1 - Pengenalan"
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">Deskripsi (opsional)</label>
                <textarea
                  rows={2}
                  value={moduleForm.description}
                  onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
                />
              </div>

              {editingModuleId ? (
                <p className="text-xs text-zinc-500">
                  Atur format kelas (8 pertemuan, pre-test UUID, urutan tryout) lewat tombol{" "}
                  <strong className="text-zinc-700">Program</strong> di daftar modul.
                </p>
              ) : (
                <details className="rounded-lg border border-zinc-200 bg-zinc-50/90">
                  <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-zinc-800">
                    Program awal (opsional)
                  </summary>
                  <div className="space-y-3 border-t border-zinc-200 px-3 py-3">
                    <p className="text-xs text-amber-900">
                      Mengisi bagian ini memicu penyimpanan program di backend (rebuild learning journey). Pastikan
                      migrasi DB course program sudah dijalankan.
                    </p>
                    <div>
                      <label className="block text-xs font-medium text-zinc-600">Tipe jalur</label>
                      <select
                        value={moduleForm.trackType}
                        onChange={(e) =>
                          setModuleForm({
                            ...moduleForm,
                            trackType: e.target.value as CourseTrackType,
                          })
                        }
                        className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
                      >
                        <option value="meetings">Pertemuan (1–8)</option>
                        <option value="tryout">Tryout terhubung</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-600">
                        Pre-test — UUID sesi tryout (opsional)
                      </label>
                      <input
                        type="text"
                        value={moduleForm.pretestTryoutSessionId}
                        onChange={(e) =>
                          setModuleForm({ ...moduleForm, pretestTryoutSessionId: e.target.value })
                        }
                        className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-sm"
                        placeholder="uuid…"
                      />
                    </div>
                    {moduleForm.trackType === "tryout" && (
                      <div>
                        <label className="block text-xs font-medium text-zinc-600">
                          Tryout terhubung (satu UUID per baris)
                        </label>
                        <textarea
                          rows={3}
                          value={moduleForm.linkedTryoutIdsText}
                          onChange={(e) =>
                            setModuleForm({ ...moduleForm, linkedTryoutIdsText: e.target.value })
                          }
                          className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-sm"
                          placeholder="uuid-1&#10;uuid-2"
                        />
                      </div>
                    )}
                    {moduleForm.trackType === "meetings" && (
                      <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                        <p className="text-xs font-medium text-zinc-600">Isian per pertemuan (opsional)</p>
                        {moduleForm.meetings.map((m, idx) => (
                          <div
                            key={m.meetingNumber}
                            className="rounded-md border border-zinc-200 bg-white p-2 text-xs"
                          >
                            <p className="mb-1 font-semibold text-zinc-800">Pertemuan {m.meetingNumber}</p>
                            <input
                              type="text"
                              placeholder="Judul"
                              value={m.title ?? ""}
                              onChange={(e) => {
                                const meetings = [...moduleForm.meetings];
                                meetings[idx] = { ...meetings[idx], title: e.target.value };
                                setModuleForm({ ...moduleForm, meetings });
                              }}
                              className="mb-1 w-full rounded border border-zinc-100 px-2 py-1"
                            />
                            <textarea
                              placeholder="Detail"
                              rows={2}
                              value={m.detailText ?? ""}
                              onChange={(e) => {
                                const meetings = [...moduleForm.meetings];
                                meetings[idx] = { ...meetings[idx], detailText: e.target.value };
                                setModuleForm({ ...moduleForm, meetings });
                              }}
                              className="mb-1 w-full rounded border border-zinc-100 px-2 py-1"
                            />
                            <input
                              type="url"
                              placeholder="URL PDF"
                              value={m.pdfUrl ?? ""}
                              onChange={(e) => {
                                const meetings = [...moduleForm.meetings];
                                meetings[idx] = { ...meetings[idx], pdfUrl: e.target.value };
                                setModuleForm({ ...moduleForm, meetings });
                              }}
                              className="mb-1 w-full rounded border border-zinc-100 px-2 py-1"
                            />
                            <div className="grid grid-cols-2 gap-1">
                              <input
                                type="text"
                                placeholder="Judul PR"
                                value={m.prTitle ?? ""}
                                onChange={(e) => {
                                  const meetings = [...moduleForm.meetings];
                                  meetings[idx] = { ...meetings[idx], prTitle: e.target.value };
                                  setModuleForm({ ...moduleForm, meetings });
                                }}
                                className="rounded border border-zinc-100 px-2 py-1"
                              />
                              <input
                                type="text"
                                placeholder="Deskripsi PR"
                                value={m.prDescription ?? ""}
                                onChange={(e) => {
                                  const meetings = [...moduleForm.meetings];
                                  meetings[idx] = { ...meetings[idx], prDescription: e.target.value };
                                  setModuleForm({ ...moduleForm, meetings });
                                }}
                                className="rounded border border-zinc-100 px-2 py-1"
                              />
                            </div>
                            <input
                              type="url"
                              placeholder="Link live class"
                              value={m.liveClassUrl ?? ""}
                              onChange={(e) => {
                                const meetings = [...moduleForm.meetings];
                                meetings[idx] = { ...meetings[idx], liveClassUrl: e.target.value };
                                setModuleForm({ ...moduleForm, meetings });
                              }}
                              className="w-full rounded border border-zinc-100 px-2 py-1"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setModuleModalOpen(false);
                    setEditingModuleId(null);
                  }}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 hover:bg-zinc-800 disabled:opacity-50"
                >
                  {submitLoading ? "Menyimpan…" : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <CourseProgramModal
        open={programCourse !== null}
        courseId={programCourse?.id ?? ""}
        courseTitle={programCourse?.title ?? ""}
        onClose={() => setProgramCourse(null)}
        onSaved={() => {
          void loadModules();
          showSuccess("Program kelas berhasil disimpan.");
        }}
      />
    </div>
  );
}

export default function MasterDataKelasDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 py-12 text-center text-sm text-zinc-500">Memuat halaman kelas…</div>
      }
    >
      <KelasDetailInner />
    </Suspense>
  );
}
