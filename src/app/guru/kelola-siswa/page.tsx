"use client";

import { Pagination, PAGE_SIZE } from "@/components/Pagination";
import { useEffect, useMemo, useState } from "react";
import { getTrainerStatus, trainerPaySlots, trainerAddStudent, getFriendlyApiErrorMessage } from "@/lib/api";

export default function GuruKelolaSiswaPage() {
  const [trainerStatus, setTrainerStatus] = useState<{
    paid_slots: number;
    registered_students_count: number;
    students?: { id: string; name: string; email: string }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [payQuantity, setPayQuantity] = useState(1);
  const [payLoading, setPayLoading] = useState(false);
  const [addStudentForm, setAddStudentForm] = useState({ name: "", email: "", password: "" });
  const [addStudentLoading, setAddStudentLoading] = useState(false);
  const [addStudentError, setAddStudentError] = useState<string | null>(null);
  const [studentPage, setStudentPage] = useState(1);

  const students = trainerStatus?.students ?? [];
  const paginatedStudents = useMemo(
    () => students.slice((studentPage - 1) * PAGE_SIZE, studentPage * PAGE_SIZE),
    [students, studentPage]
  );

  useEffect(() => {
    if (students.length > 0 && (studentPage - 1) * PAGE_SIZE >= students.length) {
      setStudentPage(1);
    }
  }, [students.length, studentPage]);

  const refetch = () => {
    getTrainerStatus(true).then(setTrainerStatus).catch(() => {});
  };

  useEffect(() => {
    getTrainerStatus(true)
      .then(setTrainerStatus)
      .catch(() => setTrainerStatus({ paid_slots: 0, registered_students_count: 0 }))
      .finally(() => setLoading(false));
  }, []);

  const slotsAvailable = trainerStatus ? Math.max(0, trainerStatus.paid_slots - trainerStatus.registered_students_count) : 0;
  const canAddStudent = slotsAvailable > 0;

  return (
    <main className="flex flex-1 flex-col px-4 py-6 sm:px-6 md:px-8 md:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Kelola Siswa</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Bayar slot pendaftaran siswa, lalu daftarkan siswa sesuai slot yang tersedia.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-sky-500" />
          Memuat status...
        </div>
      ) : (
        <div className="space-y-6">
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-800">Ringkasan slot</h2>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 px-4 py-3">
                <p className="text-[11px] font-medium text-zinc-500">Slot dibayar</p>
                <p className="mt-0.5 text-xl font-bold text-zinc-900">{trainerStatus?.paid_slots ?? 0}</p>
              </div>
              <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 px-4 py-3">
                <p className="text-[11px] font-medium text-zinc-500">Siswa terdaftar</p>
                <p className="mt-0.5 text-xl font-bold text-zinc-900">{trainerStatus?.registered_students_count ?? 0}</p>
              </div>
              <div className="rounded-xl border border-sky-100 bg-sky-50/50 px-4 py-3">
                <p className="text-[11px] font-medium text-sky-700">Slot tersisa</p>
                <p className="mt-0.5 text-xl font-bold text-sky-700">{slotsAvailable}</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-800">Bayar slot pendaftaran siswa</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Setelah pembayaran dikonfirmasi, slot dapat dipakai untuk mendaftarkan siswa.
            </p>
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="pay-qty" className="text-xs font-medium text-zinc-600">Jumlah siswa</label>
                <input
                  id="pay-qty"
                  type="number"
                  min={1}
                  max={100}
                  value={payQuantity}
                  onChange={(e) => setPayQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-24 rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                />
              </div>
              <button
                type="button"
                disabled={payLoading}
                onClick={() => {
                  setPayLoading(true);
                  trainerPaySlots({ quantity: payQuantity })
                    .then(() => refetch())
                    .catch(() => {})
                    .finally(() => setPayLoading(false));
                }}
                className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:opacity-50"
              >
                {payLoading ? "Memproses..." : "Bayar untuk slot"}
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-800">Tambah siswa</h2>
            {!canAddStudent ? (
              <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                Anda belum bisa mendaftarkan siswa. Lakukan pembayaran slot terlebih dahulu (min. 1 siswa).
              </p>
            ) : (
              <>
                <p className="mt-1 text-xs text-zinc-500">Slot tersisa: {slotsAvailable}. Isi data siswa lalu daftarkan.</p>
                {addStudentError && (
                  <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {addStudentError}
                  </div>
                )}
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <input
                    type="text"
                    placeholder="Nama siswa"
                    value={addStudentForm.name}
                    onChange={(e) => setAddStudentForm((f) => ({ ...f, name: e.target.value }))}
                    className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                  />
                  <input
                    type="email"
                    placeholder="Email siswa"
                    value={addStudentForm.email}
                    onChange={(e) => setAddStudentForm((f) => ({ ...f, email: e.target.value }))}
                    className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                  />
                  <input
                    type="password"
                    placeholder="Kata sandi"
                    value={addStudentForm.password}
                    onChange={(e) => setAddStudentForm((f) => ({ ...f, password: e.target.value }))}
                    className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                  />
                </div>
                <button
                  type="button"
                  disabled={addStudentLoading || !addStudentForm.name.trim() || !addStudentForm.email.trim() || !addStudentForm.password}
                  onClick={() => {
                    setAddStudentError(null);
                    setAddStudentLoading(true);
                    trainerAddStudent({
                      name: addStudentForm.name.trim(),
                      email: addStudentForm.email.trim(),
                      password: addStudentForm.password,
                    })
                      .then(() => {
                        setAddStudentForm({ name: "", email: "", password: "" });
                        refetch();
                      })
                      .catch((e) => setAddStudentError((e as Error).message || "Gagal mendaftarkan siswa."))
                      .finally(() => setAddStudentLoading(false));
                  }}
                  className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                >
                  {addStudentLoading ? "Mendaftarkan..." : "Daftarkan siswa"}
                </button>
              </>
            )}
          </section>

          {trainerStatus?.students && trainerStatus.students.length > 0 && (
            <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-zinc-800">Siswa yang sudah didaftarkan</h2>
              <ul className="mt-3 space-y-2">
                {paginatedStudents.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50/50 px-4 py-2.5 text-sm"
                  >
                    <span className="font-medium text-zinc-900">{s.name || "—"}</span>
                    <span className="text-zinc-500">{s.email}</span>
                  </li>
                ))}
              </ul>
              {students.length > 0 && (
                <Pagination
                  currentPage={studentPage}
                  totalItems={students.length}
                  onPageChange={setStudentPage}
                  label="siswa"
                />
              )}
            </section>
          )}
        </div>
      )}
    </main>
  );
}
