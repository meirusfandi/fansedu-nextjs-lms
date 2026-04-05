"use client";

import { FlashNoticeBar, useFlashNotice } from "@/components/FlashNotice";
import { Pagination, PAGE_SIZE } from "@/components/Pagination";
import {
  adminCreateVoucher,
  adminDeleteVoucher,
  adminGetVoucher,
  adminListVouchers,
  adminUpdateVoucher,
  getFriendlyApiErrorMessage,
} from "@/lib/api";
import type { AdminCreateVoucherRequest, AdminUpdateVoucherRequest, AdminVoucher } from "@/lib/api-types";
import {
  datetimeLocalToIsoOrNull,
  formatDiscountDisplay,
  isAdminVoucherCurrentlyValid,
  isoToDatetimeLocal,
} from "@/lib/voucher-utils";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type FormState = {
  code: string;
  discountType: "percent" | "fixed";
  discountValue: string;
  validFrom: string;
  validUntil: string;
  maxUses: string;
  isActive: boolean;
  requiresClaim: boolean;
  appliesToCourses: boolean;
  appliesToPackages: boolean;
  /** Edit: kirim validUntil: "" ke backend untuk hapus batas akhir */
  clearValidUntilEnd: boolean;
};

function emptyForm(): FormState {
  return {
    code: "",
    discountType: "percent",
    discountValue: "10",
    validFrom: "",
    validUntil: "",
    maxUses: "",
    isActive: true,
    requiresClaim: true,
    appliesToCourses: true,
    appliesToPackages: false,
    clearValidUntilEnd: false,
  };
}

function voucherToForm(v: AdminVoucher): FormState {
  return {
    code: v.code,
    discountType: v.discountType === "fixed" ? "fixed" : "percent",
    discountValue: String(v.discountValue),
    validFrom: isoToDatetimeLocal(v.validFrom),
    validUntil: isoToDatetimeLocal(v.validUntil),
    maxUses: v.maxUses != null ? String(v.maxUses) : "",
    isActive: v.isActive,
    requiresClaim: v.requiresClaim,
    appliesToCourses: v.appliesToCourses,
    appliesToPackages: v.appliesToPackages,
    clearValidUntilEnd: false,
  };
}

export default function AdminVouchersPage() {
  const { notice, showSuccess, clearNotice } = useFlashNotice();
  const [list, setList] = useState<AdminVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const [modalMode, setModalMode] = useState<"add" | "edit" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminListVouchers();
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
    const f = emptyForm();
    f.code = `VC${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    setForm(f);
    setEditingId(null);
    setModalMode("add");
    setSubmitError(null);
  };

  const openEdit = async (v: AdminVoucher) => {
    setSubmitError(null);
    setModalMode("edit");
    setEditingId(v.id);
    try {
      const full = await adminGetVoucher(v.id);
      setForm(voucherToForm(full ?? v));
    } catch {
      setForm(voucherToForm(v));
    }
  };

  const buildCreatePayload = (): AdminCreateVoucherRequest | null => {
    const dv = Number(form.discountValue);
    if (!Number.isFinite(dv) || dv < 0) return null;
    if (form.discountType === "percent" && (dv < 0 || dv > 100)) return null;
    if (!form.code.trim()) return null;
    if (!form.appliesToCourses && !form.appliesToPackages) return null;

    const validFrom = datetimeLocalToIsoOrNull(form.validFrom);
    const validUntil = datetimeLocalToIsoOrNull(form.validUntil);
    let maxUses: number | null | undefined = undefined;
    if (form.maxUses.trim() !== "") {
      const n = parseInt(form.maxUses, 10);
      if (!Number.isFinite(n) || n < 1) return null;
      maxUses = n;
    }

    const body: AdminCreateVoucherRequest = {
      code: form.code.trim().toUpperCase(),
      discountType: form.discountType,
      discountValue: form.discountType === "percent" ? dv : Math.floor(dv),
      isActive: form.isActive,
      requiresClaim: form.requiresClaim,
      appliesToCourses: form.appliesToCourses,
      appliesToPackages: form.appliesToPackages,
    };
    if (validFrom != null) body.validFrom = validFrom;
    if (validUntil != null) body.validUntil = validUntil;
    if (maxUses !== undefined) body.maxUses = maxUses;
    return body;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!form.appliesToCourses && !form.appliesToPackages) {
      setSubmitError("Minimal pilih salah satu: berlaku untuk kelas atau untuk paket landing.");
      return;
    }

    if (modalMode === "add") {
      const payload = buildCreatePayload();
      if (!payload) {
        setSubmitError("Periksa kode, nominal diskon, dan batas pemakaian (jika diisi).");
        return;
      }
      setSubmitLoading(true);
      try {
        await adminCreateVoucher(payload);
        showSuccess("Voucher berhasil dibuat.");
        setModalMode(null);
        setEditingId(null);
        await load();
      } catch (err) {
        setSubmitError(getFriendlyApiErrorMessage(err));
      } finally {
        setSubmitLoading(false);
      }
      return;
    }

    if (modalMode === "edit" && editingId) {
      const dv = Number(form.discountValue);
      if (!Number.isFinite(dv) || dv < 0) {
        setSubmitError("Nilai diskon tidak valid.");
        return;
      }
      if (form.discountType === "percent" && (dv < 0 || dv > 100)) {
        setSubmitError("Diskon persen harus 0–100.");
        return;
      }
      setSubmitLoading(true);
      try {
        const patch: AdminUpdateVoucherRequest = {
          code: form.code.trim().toUpperCase(),
          discountType: form.discountType,
          discountValue: form.discountType === "percent" ? dv : Math.floor(dv),
          isActive: form.isActive,
          requiresClaim: form.requiresClaim,
          appliesToCourses: form.appliesToCourses,
          appliesToPackages: form.appliesToPackages,
        };
        const vf = datetimeLocalToIsoOrNull(form.validFrom);
        patch.validFrom = vf;
        if (form.clearValidUntilEnd) {
          patch.validUntil = "";
        } else {
          const vu = datetimeLocalToIsoOrNull(form.validUntil);
          patch.validUntil = vu;
        }
        if (form.maxUses.trim() === "") {
          patch.maxUses = null;
        } else {
          const n = parseInt(form.maxUses, 10);
          if (!Number.isFinite(n) || n < 1) {
            setSubmitError("maxUses harus kosong (tak terbatas) atau angka ≥ 1.");
            setSubmitLoading(false);
            return;
          }
          patch.maxUses = n;
        }

        await adminUpdateVoucher(editingId, patch);
        showSuccess("Voucher berhasil diperbarui.");
        setModalMode(null);
        setEditingId(null);
        await load();
      } catch (err) {
        setSubmitError(getFriendlyApiErrorMessage(err));
      } finally {
        setSubmitLoading(false);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus voucher ini?")) return;
    try {
      await adminDeleteVoucher(id);
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
            Buat dan kelola kode promo: diskon persen atau nominal tetap, masa berlaku, batas pemakaian, serta apakah berlaku
            untuk pembelian kelas atau paket landing. Jika &quot;Wajib klaim&quot; aktif, siswa harus mengklaim kode sebelum
            checkout.
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
          <p className="mt-1 text-sm text-zinc-600">Buat dari backend atau klik &quot;Tambah voucher&quot;.</p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-zinc-200 text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Kode</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Diskon</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Berlaku</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Pakai</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Scope</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {paginated.map((v) => {
                  const valid = isAdminVoucherCurrentlyValid(v);
                  return (
                    <tr key={v.id} className="text-zinc-900">
                      <td className="px-4 py-3 font-mono text-xs font-semibold">{v.code}</td>
                      <td className="px-4 py-3">{formatDiscountDisplay(v)}</td>
                      <td className="max-w-[180px] px-4 py-3 text-xs text-zinc-600">
                        {v.validFrom ? <div>dari {isoToDatetimeLocal(v.validFrom).replace("T", " ")}</div> : null}
                        {v.validUntil ? <div>s/d {isoToDatetimeLocal(v.validUntil).replace("T", " ")}</div> : <div>tanpa akhir</div>}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-700">
                        {v.usedCount ?? 0}
                        {v.maxUses != null ? ` / ${v.maxUses}` : " / ∞"}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-600">
                        {v.appliesToCourses ? "Kelas " : ""}
                        {v.appliesToCourses && v.appliesToPackages ? "· " : ""}
                        {v.appliesToPackages ? "Paket" : ""}
                        {!v.appliesToCourses && !v.appliesToPackages ? "—" : ""}
                        {v.requiresClaim ? (
                          <span className="ml-1 rounded bg-amber-100 px-1 text-amber-900">klaim</span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-medium ${
                            valid ? "bg-emerald-100 text-emerald-900" : "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {v.isActive ? (valid ? "Berlaku" : "Tidak berlaku") : "Nonaktif"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => void openEdit(v)}
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
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-800">Tipe diskon *</label>
                  <select
                    value={form.discountType}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, discountType: e.target.value as "percent" | "fixed" }))
                    }
                    className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
                  >
                    <option value="percent">Persen (%)</option>
                    <option value="fixed">Nominal tetap (Rp)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-800">
                    Nilai * {form.discountType === "percent" ? "(0–100)" : "(Rp)"}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={form.discountType === "percent" ? 100 : undefined}
                    step={form.discountType === "percent" ? 1 : 1}
                    value={form.discountValue}
                    onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-800">Valid dari (opsional)</label>
                  <input
                    type="datetime-local"
                    value={form.validFrom}
                    onChange={(e) => setForm((f) => ({ ...f, validFrom: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-800">Valid sampai (opsional)</label>
                  <input
                    type="datetime-local"
                    value={form.validUntil}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, validUntil: e.target.value, clearValidUntilEnd: false }))
                    }
                    disabled={form.clearValidUntilEnd}
                    className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 disabled:opacity-50"
                  />
                  {modalMode === "edit" && (
                    <label className="mt-2 flex items-center gap-2 text-xs text-zinc-700">
                      <input
                        type="checkbox"
                        checked={form.clearValidUntilEnd}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, clearValidUntilEnd: e.target.checked }))
                        }
                        className="h-4 w-4 accent-zinc-900"
                      />
                      Hapus batas akhir
                    </label>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-800">
                  Maks. pemakaian global (opsional)
                </label>
                <input
                  type="number"
                  min={1}
                  placeholder="Kosong = tidak dibatasi"
                  value={form.maxUses}
                  onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
                />
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-800">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="h-4 w-4 accent-zinc-900"
                />
                Aktif
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-800">
                <input
                  type="checkbox"
                  checked={form.requiresClaim}
                  onChange={(e) => setForm((f) => ({ ...f, requiresClaim: e.target.checked }))}
                  className="h-4 w-4 accent-zinc-900"
                />
                Wajib klaim siswa sebelum checkout
              </label>
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-xs font-medium text-zinc-800">Berlaku untuk *</p>
                <label className="mt-2 flex items-center gap-2 text-sm text-zinc-800">
                  <input
                    type="checkbox"
                    checked={form.appliesToCourses}
                    onChange={(e) => setForm((f) => ({ ...f, appliesToCourses: e.target.checked }))}
                    className="h-4 w-4 accent-zinc-900"
                  />
                  Pembelian kelas
                </label>
                <label className="mt-1 flex items-center gap-2 text-sm text-zinc-800">
                  <input
                    type="checkbox"
                    checked={form.appliesToPackages}
                    onChange={(e) => setForm((f) => ({ ...f, appliesToPackages: e.target.checked }))}
                    className="h-4 w-4 accent-zinc-900"
                  />
                  Paket landing
                </label>
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

      <p className="mt-8 text-center text-xs text-zinc-500">
        <Link href="/admin/kelas" className="text-emerald-700 underline">
          Management Kelas
        </Link>{" "}
        menyimpan daftar kelas lokal di browser; voucher di halaman ini mengatur promo saat pembelian kelas lewat sistem,
        terpisah dari modul lokal tersebut.
      </p>
    </div>
  );
}
