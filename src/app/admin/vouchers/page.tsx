"use client";

import { FlashNoticeBar, useFlashNotice } from "@/components/FlashNotice";
import { Pagination, PAGE_SIZE } from "@/components/Pagination";
import { useAdminLocalClasses } from "@/features/admin/useAdminLocalClasses";
import { getFriendlyApiErrorMessage } from "@/lib/api";
import {
  createVoucher,
  deleteVoucher,
  fetchVouchers,
  isVoucherCurrentlyValid,
  newVoucherId,
  updateVoucher,
} from "@/lib/vouchers-client";
import type { Voucher } from "@/lib/vouchers/types";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

function formatRp(n: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(
    n
  );
}

function toDateInputValue(isoOrDate: string): string {
  if (!isoOrDate) return "";
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) {
    const m = /^(\d{4}-\d{2}-\d{2})/.exec(isoOrDate);
    return m ? m[1] : "";
  }
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

const emptyForm = {
  code: "",
  name: "",
  nominal: "",
  expiresAt: "",
  active: true,
  applicableClassIds: [] as string[],
};

export default function AdminVouchersPage() {
  const { notice, showSuccess, clearNotice } = useFlashNotice();
  const { classes } = useAdminLocalClasses();
  const [list, setList] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const [modalMode, setModalMode] = useState<"add" | "edit" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchVouchers();
      setList(data.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    } catch (e) {
      setError(getFriendlyApiErrorMessage(e));
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const paginated = useMemo(
    () => list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [list, page]
  );

  useEffect(() => {
    if (list.length > 0 && (page - 1) * PAGE_SIZE >= list.length) {
      setPage(1);
    }
  }, [list.length, page]);

  const openAdd = () => {
    setForm({
      ...emptyForm,
      code: `VC${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      expiresAt: toDateInputValue(new Date(Date.now() + 30 * 86400000).toISOString()),
    });
    setEditingId(null);
    setModalMode("add");
    setSubmitError(null);
  };

  const openEdit = (v: Voucher) => {
    setForm({
      code: v.code,
      name: v.name,
      nominal: String(v.nominal),
      expiresAt: toDateInputValue(v.expiresAt),
      active: v.active,
      applicableClassIds: [...v.applicableClassIds],
    });
    setEditingId(v.id);
    setModalMode("edit");
    setSubmitError(null);
  };

  const toggleClass = (classId: string) => {
    setForm((f) => {
      const set = new Set(f.applicableClassIds);
      if (set.has(classId)) set.delete(classId);
      else set.add(classId);
      return { ...f, applicableClassIds: [...set] };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const nominal = Math.floor(Number(form.nominal));
    if (!form.code.trim() || !form.name.trim()) {
      setSubmitError("Kode dan nama wajib diisi.");
      return;
    }
    if (!Number.isFinite(nominal) || nominal < 0) {
      setSubmitError("Nominal tidak valid.");
      return;
    }
    if (!form.expiresAt.trim()) {
      setSubmitError("Tanggal kedaluwarsa wajib diisi.");
      return;
    }
    const expiresAt = form.expiresAt.trim();
    setSubmitLoading(true);
    try {
      if (modalMode === "add") {
        await createVoucher({
          code: form.code.trim().toUpperCase(),
          name: form.name.trim(),
          nominal,
          expiresAt,
          active: form.active,
          applicableClassIds: form.applicableClassIds,
          id: newVoucherId(),
        });
        showSuccess("Voucher berhasil ditambahkan.");
      } else if (modalMode === "edit" && editingId) {
        await updateVoucher(editingId, {
          code: form.code.trim().toUpperCase(),
          name: form.name.trim(),
          nominal,
          expiresAt,
          active: form.active,
          applicableClassIds: form.applicableClassIds,
        });
        showSuccess("Voucher berhasil diperbarui.");
      }
      setModalMode(null);
      setEditingId(null);
      await load();
    } catch (err) {
      setSubmitError((err as Error).message ?? "Gagal menyimpan");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus voucher ini?")) return;
    try {
      await deleteVoucher(id);
      showSuccess("Voucher berhasil dihapus.");
      await load();
    } catch (err) {
      setError(getFriendlyApiErrorMessage(err));
    }
  };

  return (
    <div className="px-4 py-5 text-zinc-900 [color-scheme:light] sm:px-6 md:px-8 md:py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between md:mb-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Manage</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">Voucher</h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-600">
            Buat kode diskon dengan nominal dan tanggal kedaluwarsa. Pasangkan ke{" "}
            <Link href="/admin/kelas" className="font-medium text-emerald-700 underline hover:text-emerald-900">
              Management Kelas
            </Link>{" "}
            (data kelas lokal di browser) agar terlihat di daftar kelas.
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Data disimpan di <code className="rounded bg-zinc-100 px-1">data/vouchers.json</code> (server).
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="shrink-0 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          + Tambah voucher
        </button>
      </div>

      {notice && (
        <div className="mb-4">
          <FlashNoticeBar kind={notice.kind} message={notice.text} onDismiss={clearNotice} />
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
      )}

      {loading ? (
        <p className="text-sm text-zinc-600">Memuat voucher…</p>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/80 px-6 py-12 text-center">
          <p className="text-sm font-medium text-zinc-800">Belum ada voucher</p>
          <p className="mt-1 text-sm text-zinc-600">Klik &quot;Tambah voucher&quot; untuk membuat kode diskon.</p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-zinc-200 text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Kode</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Nama</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Nominal</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Kedaluwarsa</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Kelas</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {paginated.map((v) => {
                  const valid = isVoucherCurrentlyValid(v);
                  return (
                    <tr key={v.id} className="text-zinc-900">
                      <td className="px-4 py-3 font-mono text-xs font-semibold">{v.code}</td>
                      <td className="px-4 py-3">{v.name}</td>
                      <td className="px-4 py-3">{formatRp(v.nominal)}</td>
                      <td className="px-4 py-3 text-zinc-700">{toDateInputValue(v.expiresAt)}</td>
                      <td className="px-4 py-3 text-xs text-zinc-600">
                        {v.applicableClassIds.length === 0 ? (
                          <span className="text-zinc-400">—</span>
                        ) : (
                          <span>{v.applicableClassIds.length} kelas</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-medium ${
                            valid
                              ? "bg-emerald-100 text-emerald-900"
                              : "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {v.active ? (valid ? "Berlaku" : "Kedaluwarsa/nonaktif") : "Nonaktif"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => openEdit(v)}
                          className="mr-2 text-xs font-medium text-zinc-700 underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(v.id)}
                          className="text-xs text-red-600 underline"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {list.length > PAGE_SIZE && (
            <div className="mt-6">
              <Pagination currentPage={page} totalItems={list.length} onPageChange={setPage} label="voucher" />
            </div>
          )}
        </>
      )}

      {modalMode && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-4 [color-scheme:light]">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-zinc-900">
              {modalMode === "add" ? "Tambah voucher" : "Edit voucher"}
            </h2>
            <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-4">
              {submitError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {submitError}
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-zinc-800">Kode *</label>
                <input
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm text-zinc-900"
                  placeholder="VCABC123"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-800">Nama / keterangan *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-800">Nominal (Rp) *</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={form.nominal}
                  onChange={(e) => setForm((f) => ({ ...f, nominal: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-800">Kedaluwarsa *</label>
                <input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
                  required
                />
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-800">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                  className="h-4 w-4 rounded border-zinc-400 accent-zinc-900"
                />
                Aktif
              </label>
              <div>
                <p className="text-xs font-medium text-zinc-800">Pasang di kelas (Management Kelas)</p>
                <p className="mt-0.5 text-[11px] text-zinc-500">
                  Centang kelas yang boleh memakai voucher ini. Kosong = belum dipasang ke kelas manapun.
                </p>
                {classes.length === 0 ? (
                  <p className="mt-2 text-xs text-amber-800">
                    Belum ada kelas lokal. Buat di{" "}
                    <Link href="/admin/kelas" className="underline">
                      Management Kelas
                    </Link>
                    .
                  </p>
                ) : (
                  <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto rounded-lg border border-zinc-200 bg-zinc-50 p-2">
                    {classes.map((c) => (
                      <li key={c.id}>
                        <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm text-zinc-900 hover:bg-white">
                          <input
                            type="checkbox"
                            checked={form.applicableClassIds.includes(c.id)}
                            onChange={() => toggleClass(c.id)}
                            className="h-4 w-4 border-zinc-400 accent-zinc-900"
                          />
                          <span className="min-w-0 truncate">{c.title}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalMode(null);
                    setEditingId(null);
                  }}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                >
                  {submitLoading ? "Menyimpan…" : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
