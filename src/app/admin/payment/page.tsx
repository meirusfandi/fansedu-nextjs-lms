"use client";

import { Pagination, PAGE_SIZE } from "@/components/Pagination";
import {
  useAdminConfirmPayment,
  useAdminCoursesForPaymentModal,
  useAdminCreateManualOrder,
  useAdminPayments,
  useAdminPatchOrderPurchaseMeta,
  useAdminRejectPayment,
  useAdminUploadOrderPaymentProof,
  useAdminVerifyOrder,
  useAdminUpdatePayment,
  useAdminUsersForPaymentModal,
} from "@/hooks/useDashboardQueries";
import { adminListCourses, checkoutCreatePaymentSession, getFriendlyApiErrorMessage } from "@/lib/api";
import type { CheckoutPaymentSessionResponse, Payment } from "@/lib/api-types";
import { formatPaymentMoney, isPendingStatus, paymentStatusLabel } from "@/lib/paymentDisplay";
import { normalizeUserRoleFromApi } from "@/lib/user-role";
import { datetimeLocalToIsoOrNull, isoToDatetimeLocal } from "@/lib/voucher-utils";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

function paymentPurchaseAt(p: Payment): string | undefined {
  const v = p.paidAt ?? p.purchasedAt ?? p.createdAt;
  return v != null && String(v).trim() !== "" ? String(v) : undefined;
}

function getPaymentCreatedAt(p: Payment): string | undefined {
  return p.createdAt;
}

function getPaymentUserName(p: Payment): string {
  return p.userName ?? "–";
}

function getPaymentUserEmail(p: Payment): string {
  return p.userEmail ?? p.userId ?? "";
}

function getPaymentOrdererName(p: Payment): string {
  const raw = p as Record<string, unknown>;
  return (
    (typeof raw.userName === "string" && raw.userName.trim()) ||
    (typeof raw.customerName === "string" && raw.customerName.trim()) ||
    (typeof raw.orderedByName === "string" && raw.orderedByName.trim()) ||
    getPaymentUserName(p)
  );
}

function getPaymentOrdererEmail(p: Payment): string {
  const raw = p as Record<string, unknown>;
  return (
    (typeof raw.userEmail === "string" && raw.userEmail.trim()) ||
    (typeof raw.customerEmail === "string" && raw.customerEmail.trim()) ||
    (typeof raw.orderedByEmail === "string" && raw.orderedByEmail.trim()) ||
    getPaymentUserEmail(p)
  );
}

function getPaymentPayerName(p: Payment): string {
  const raw = p as Record<string, unknown>;
  return (
    (typeof raw.payerName === "string" && raw.payerName.trim()) ||
    (typeof raw.senderName === "string" && raw.senderName.trim()) ||
    (typeof raw.paidByName === "string" && raw.paidByName.trim()) ||
    (typeof raw.accountName === "string" && raw.accountName.trim()) ||
    getPaymentOrdererName(p)
  );
}

function getAccountTypeLabel(p: Payment): string {
  const raw = p as Record<string, unknown>;
  const source =
    (typeof raw.userRole === "string" && raw.userRole) ||
    (typeof raw.role === "string" && raw.role) ||
    p.payerRole ||
    "";
  const normalized = normalizeUserRoleFromApi(source);
  if (normalized === "student") return "Siswa";
  if (normalized === "trainer") return "Guru";
  return "–";
}

function getPaymentTypeLabel(p: Payment): string {
  const t = String(p.type ?? "").toLowerCase().trim();
  if (!t) return "Pembayaran";
  if (t.includes("course")) return "Pembelian Kelas";
  if (t.includes("slot")) return "Pembelian Slot";
  if (t.includes("manual")) return "Pembayaran Manual";
  if (t.includes("midtrans")) return "Pembayaran Midtrans";
  if (t.includes("transfer")) return "Transfer Bank";
  if (t.includes("subscription")) return "Langganan";
  return "Pembayaran";
}

function getPaymentProofUrl(p: Payment): string | null {
  return p.proofUrl ?? null;
}

function isCoursePayment(p: Payment): boolean {
  const t = (p.type ?? "").toLowerCase();
  return t.includes("course");
}

export default function AdminPaymentPage() {
  const { data: payments = [], isLoading, error, refetch, isFetching } = useAdminPayments();
  const confirmMutation = useAdminConfirmPayment();
  const rejectMutation = useAdminRejectPayment();
  const createOrderMutation = useAdminCreateManualOrder();
  const uploadProofMutation = useAdminUploadOrderPaymentProof();
  const verifyOrderMutation = useAdminVerifyOrder();
  const patchOrderMetaMutation = useAdminPatchOrderPurchaseMeta();
  const updateMutation = useAdminUpdatePayment();

  const [filter, setFilter] = useState<"all" | "pending">("all");
  const [page, setPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [createUserId, setCreateUserId] = useState("");
  const [createCourseIds, setCreateCourseIds] = useState<string[]>([]);
  const [createTotalPriceRp, setCreateTotalPriceRp] = useState("");
  const [createPurchasedAtLocal, setCreatePurchasedAtLocal] = useState(() =>
    isoToDatetimeLocal(new Date().toISOString())
  );
  const [verifyImmediately, setVerifyImmediately] = useState(true);
  const [createProofFile, setCreateProofFile] = useState<File | null>(null);
  const [createSenderAccountNo, setCreateSenderAccountNo] = useState("");
  const [createSenderName, setCreateSenderName] = useState("");
  const [createFormError, setCreateFormError] = useState<string | null>(null);

  const [editPayment, setEditPayment] = useState<Payment | null>(null);
  const [editPurchasedAtLocal, setEditPurchasedAtLocal] = useState("");
  const [editFormError, setEditFormError] = useState<string | null>(null);

  const [midtransCheckoutId, setMidtransCheckoutId] = useState("");
  const [midtransLoading, setMidtransLoading] = useState(false);
  const [midtransError, setMidtransError] = useState<string | null>(null);
  const [midtransResult, setMidtransResult] = useState<CheckoutPaymentSessionResponse | null>(null);

  const { data: modalUsers = [], isLoading: loadingModalUsers } = useAdminUsersForPaymentModal(createOpen);
  const { data: modalCourses = [], isLoading: loadingModalCourses } = useAdminCoursesForPaymentModal(createOpen);

  const { data: coursesForTable = [] } = useQuery({
    queryKey: ["admin", "courses", "payment-table"],
    queryFn: adminListCourses,
    staleTime: 60_000,
  });

  const courseTitleById = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of coursesForTable) {
      m.set(c.id, c.title);
    }
    return m;
  }, [coursesForTable]);

  const students = useMemo(
    () => modalUsers.filter((u) => normalizeUserRoleFromApi(u.role) === "student"),
    [modalUsers]
  );

  useEffect(() => {
    if (!createOpen) {
      setCreateFormError(null);
      return;
    }
    setCreatePurchasedAtLocal(isoToDatetimeLocal(new Date().toISOString()));
  }, [createOpen]);

  useEffect(() => {
    if (editPayment) {
      const iso = paymentPurchaseAt(editPayment);
      setEditPurchasedAtLocal(iso ? isoToDatetimeLocal(iso) : "");
      setEditFormError(null);
    }
  }, [editPayment]);

  const filtered = useMemo(() => {
    if (filter === "pending") {
      return payments.filter((p) => isPendingStatus(p.status));
    }
    return payments;
  }, [payments, filter]);

  const paginated = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  useEffect(() => {
    setPage(1);
  }, [filter]);

  useEffect(() => {
    if (filtered.length > 0 && (page - 1) * PAGE_SIZE >= filtered.length) {
      setPage(1);
    }
  }, [filtered.length, page]);

  const openCreate = () => {
    setCreateUserId("");
    setCreateCourseIds([]);
    setCreateTotalPriceRp("");
    setCreateProofFile(null);
    setCreateSenderAccountNo("");
    setCreateSenderName("");
    setVerifyImmediately(true);
    setCreateFormError(null);
    setCreateOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateFormError(null);
    if (!createUserId.trim()) {
      setCreateFormError("Pilih siswa.");
      return;
    }
    if (createCourseIds.length === 0) {
      setCreateFormError("Pilih minimal satu kelas.");
      return;
    }
    const totalPriceText = String(createTotalPriceRp).trim();
    if (totalPriceText && (!Number.isFinite(Number(totalPriceText)) || Number(totalPriceText) <= 0)) {
      setCreateFormError("Total harga harus angka positif atau dikosongkan.");
      return;
    }
    const purchasedIso = datetimeLocalToIsoOrNull(createPurchasedAtLocal);
    try {
      const order = await createOrderMutation.mutateAsync({
        userId: createUserId.trim(),
        courseIds: createCourseIds,
        totalPrice: totalPriceText ? Number(totalPriceText) : undefined,
      });
      const orderId = String(order.id ?? "").trim();
      if (!orderId) throw new Error("Order berhasil dibuat tapi id order tidak ditemukan.");
      if (createProofFile) {
        await uploadProofMutation.mutateAsync({
          orderId,
          proofFile: createProofFile,
          senderAccountNo: createSenderAccountNo.trim() || undefined,
          senderName: createSenderName.trim() || undefined,
        });
      }
      if (verifyImmediately) {
        await verifyOrderMutation.mutateAsync({
          orderId,
          body: purchasedIso ? { purchasedAt: purchasedIso } : {},
        });
      }
      setMidtransCheckoutId(orderId);
      setCreateOpen(false);
    } catch (err) {
      setCreateFormError(getFriendlyApiErrorMessage(err));
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPayment) return;
    setEditFormError(null);
    const purchasedIso = datetimeLocalToIsoOrNull(editPurchasedAtLocal);
    if (purchasedIso == null) {
      setEditFormError("Tanggal pembelian tidak valid.");
      return;
    }
    try {
      const orderId = editPayment.orderId != null ? String(editPayment.orderId).trim() : "";
      if (orderId) {
        await patchOrderMetaMutation.mutateAsync({
          orderId,
          body: { purchasedAt: purchasedIso },
        });
      } else {
        await updateMutation.mutateAsync({
          paymentId: editPayment.id,
          body: { purchasedAt: purchasedIso },
        });
      }
      setEditPayment(null);
    } catch (err) {
      setEditFormError(getFriendlyApiErrorMessage(err));
    }
  };

  const handleConfirm = async (p: Payment) => {
    if (!confirm("Konfirmasi pembayaran ini? Status akan menjadi disetujui.")) return;
    try {
      const orderId = p.orderId != null ? String(p.orderId).trim() : "";
      if (orderId) {
        const purchasedAt = paymentPurchaseAt(p);
        await verifyOrderMutation.mutateAsync({
          orderId,
          body: purchasedAt ? { purchasedAt } : {},
        });
      } else {
        await confirmMutation.mutateAsync(p.id);
      }
    } catch (e) {
      alert(getFriendlyApiErrorMessage(e));
    }
  };

  const handleReject = async (p: Payment) => {
    const reason = window.prompt("Alasan penolakan (opsional). Kosongkan lalu OK untuk menolak tanpa catatan:");
    if (reason === null) return;
    try {
      await rejectMutation.mutateAsync({ paymentId: p.id, reason: reason.trim() || undefined });
    } catch (e) {
      alert(getFriendlyApiErrorMessage(e));
    }
  };

  const modalLoading = loadingModalUsers || loadingModalCourses;

  const handleMidtransSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setMidtransError(null);
    setMidtransResult(null);
    const id = midtransCheckoutId.trim();
    if (!id) {
      setMidtransError("Isi order / checkout ID.");
      return;
    }
    setMidtransLoading(true);
    try {
      const res = await checkoutCreatePaymentSession({
        checkoutId: id,
        paymentMethod: "midtrans",
      });
      setMidtransResult(res);
    } catch (err) {
      setMidtransError(getFriendlyApiErrorMessage(err));
    } finally {
      setMidtransLoading(false);
    }
  };

  return (
    <div className="px-4 py-5 sm:px-6 md:px-8 md:py-8">
      <div className="mb-6 md:mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Manage</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">Payment &amp; konfirmasi</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Verifikasi pembayaran dari trainer maupun siswa. Admin bisa membuat order manual untuk pembelian kelas siswa,
          upload bukti pembayaran, verifikasi order, mengarahkan ke pembayaran Midtrans Snap, dan mengubah tanggal
          pembelian.
        </p>
      </div>

      <section className="mb-6 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-900">Pembayaran Midtrans (Snap)</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Buat sesi pembayaran untuk order yang sudah ada. Backend mengembalikan alamat redirect ke halaman Snap.
          Konfigurasi kunci server Midtrans ada di lingkungan server backend (bukan di frontend).
        </p>
        <form onSubmit={(e) => void handleMidtransSession(e)} className="mt-3 flex flex-wrap items-end gap-2">
          <div className="min-w-[200px] flex-1">
            <label className="block text-xs font-medium text-zinc-700">Order / checkout ID</label>
            <input
              value={midtransCheckoutId}
              onChange={(e) => setMidtransCheckoutId(e.target.value)}
              placeholder="UUID order"
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={midtransLoading}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {midtransLoading ? "Membuat sesi…" : "Buat sesi pembayaran"}
          </button>
        </form>
        {midtransError ? (
          <p className="mt-2 text-sm text-red-700">{midtransError}</p>
        ) : null}
        {midtransResult && Object.keys(midtransResult).length > 0 ? (
          <div className="mt-3 space-y-2 rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-sm text-zinc-800">
            {midtransResult.redirectUrl != null && String(midtransResult.redirectUrl).trim() !== "" ? (
              <div>
                <p className="text-xs font-medium text-zinc-600">Redirect URL</p>
                <a
                  href={String(midtransResult.redirectUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-sky-700 underline"
                >
                  {String(midtransResult.redirectUrl)}
                </a>
                <button
                  type="button"
                  onClick={() => void navigator.clipboard.writeText(String(midtransResult.redirectUrl))}
                  className="ml-2 text-xs font-medium text-zinc-600 underline"
                >
                  Salin
                </button>
              </div>
            ) : null}
            {midtransResult.snapToken != null && String(midtransResult.snapToken).trim() !== "" ? (
              <p>
                <span className="text-xs font-medium text-zinc-600">Snap token: </span>
                <code className="text-xs">{String(midtransResult.snapToken).slice(0, 40)}…</code>
              </p>
            ) : null}
            {midtransResult.transactionId != null && String(midtransResult.transactionId).trim() !== "" ? (
              <p>
                <span className="text-xs font-medium text-zinc-600">Transaction ID: </span>
                {String(midtransResult.transactionId)}
              </p>
            ) : null}
          </div>
        ) : null}
      </section>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {getFriendlyApiErrorMessage(error)}
          <button type="button" onClick={() => refetch()} className="ml-2 font-medium underline">
            Muat ulang
          </button>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="text-xs font-medium text-zinc-500">Filter:</span>
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
            filter === "all" ? "bg-zinc-900 text-white" : "border border-zinc-200 bg-white text-zinc-700"
          }`}
        >
          Semua
        </button>
        <button
          type="button"
          onClick={() => setFilter("pending")}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
            filter === "pending" ? "bg-amber-600 text-white" : "border border-zinc-200 bg-white text-zinc-700"
          }`}
        >
          Menunggu verifikasi
        </button>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-800"
        >
          + Buat order manual kelas
        </button>
        <span className="text-xs text-zinc-400">
          {isFetching ? "Memuat…" : `${filtered.length} transaksi`}
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-sm text-zinc-500">Memuat pembayaran…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-medium text-zinc-700">Belum ada data pembayaran</p>
            <p className="mt-2 text-xs text-zinc-500">
              Jika seharusnya ada transaksi, periksa koneksi ke server dan hak akses admin. Dokumentasi alur ada di{" "}
              <code className="rounded bg-zinc-100 px-1">docs/PAYMENT_AND_CONFIRMATION_FLOW.md</code>.
            </p>
            <button
              type="button"
              onClick={openCreate}
              className="mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Buat order manual
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-100 text-sm">
              <thead className="bg-zinc-50/80">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Tanggal pembelian
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Dicatat
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Pemesan</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Nama pembayar</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Peran
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Tipe / Kelas
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Nominal
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {paginated.map((p) => {
                  const purchase = paymentPurchaseAt(p);
                  const created = getPaymentCreatedAt(p);
                  const refId = p.referenceId != null ? String(p.referenceId) : "";
                  const paymentTypeLabel = getPaymentTypeLabel(p);
                  const courseLabel =
                    isCoursePayment(p) && refId
                      ? courseTitleById.get(refId) ?? "Kelas"
                      : paymentTypeLabel;
                  const typeAndClassLabel =
                    isCoursePayment(p) && refId
                      ? `${paymentTypeLabel} • ${courseLabel}`
                      : paymentTypeLabel;
                  return (
                    <tr key={p.id} className="hover:bg-zinc-50/80">
                      <td className="whitespace-nowrap px-4 py-3 text-zinc-600">
                        {purchase
                          ? new Date(purchase).toLocaleString("id-ID", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })
                          : "–"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-500">
                        {created
                          ? new Date(created).toLocaleString("id-ID", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })
                          : "–"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-zinc-900">{getPaymentOrdererName(p)}</div>
                        <div className="text-xs text-zinc-500">{getPaymentOrdererEmail(p)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-zinc-900">{getPaymentPayerName(p)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium capitalize text-zinc-700">
                          {getAccountTypeLabel(p)}
                        </span>
                      </td>
                      <td className="max-w-[200px] px-4 py-3 text-zinc-600">
                        <span className="line-clamp-2" title={typeAndClassLabel}>
                          {typeAndClassLabel}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-zinc-900">
                        {formatPaymentMoney(p)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                            isPendingStatus(p.status)
                              ? "bg-amber-100 text-amber-900"
                              : (p.status ?? "").toLowerCase() === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {paymentStatusLabel(p.status)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <Link
                          href={`/admin/payment/${encodeURIComponent(String(p.id))}`}
                          className="mr-2 text-xs font-medium text-zinc-700 hover:underline"
                        >
                          Detail
                        </Link>
                        <button
                          type="button"
                          onClick={() => setEditPayment(p)}
                          className="mr-2 text-xs font-medium text-sky-700 hover:underline"
                        >
                          Ubah tanggal
                        </button>
                        {getPaymentProofUrl(p) && (
                          <a
                            href={String(getPaymentProofUrl(p))}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mr-2 text-xs font-medium text-sky-600 hover:underline"
                          >
                            Bukti
                          </a>
                        )}
                        {isPendingStatus(p.status) && (
                          <>
                            <button
                              type="button"
                              disabled={confirmMutation.isPending || rejectMutation.isPending}
                              onClick={() => handleConfirm(p)}
                              className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              Setujui
                            </button>
                            <button
                              type="button"
                              disabled={confirmMutation.isPending || rejectMutation.isPending}
                              onClick={() => handleReject(p)}
                              className="ml-2 rounded-lg border border-red-200 bg-white px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                            >
                              Tolak
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!isLoading && filtered.length > 0 && (
          <Pagination
            currentPage={page}
            totalItems={filtered.length}
            onPageChange={setPage}
            label="transaksi"
          />
        )}
      </div>

      <p className="mt-6 text-xs text-zinc-500">
        Pembaruan tanggal pembelian memakai metadata order bila transaksi terhubung ke order. Untuk data lama tanpa
        order, sistem fallback ke update pembayaran langsung.
      </p>

      {createOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4 [color-scheme:light]">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-zinc-900">Buat order manual kelas</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Buat order pending untuk siswa, lalu opsional upload bukti dan verifikasi langsung agar enroll diproses.
            </p>
            <form onSubmit={(e) => void handleCreateSubmit(e)} className="mt-4 space-y-4">
              {createFormError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {createFormError}
                </div>
              )}
              {modalLoading ? (
                <p className="text-sm text-zinc-500">Memuat daftar siswa dan kelas…</p>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700">Siswa *</label>
                    <select
                      value={createUserId}
                      onChange={(e) => setCreateUserId(e.target.value)}
                      required
                      className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                    >
                      <option value="">— Pilih siswa —</option>
                      {students.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                    </select>
                    {students.length === 0 && !loadingModalUsers ? (
                      <p className="mt-1 text-xs text-amber-700">Tidak ada akun siswa di daftar user.</p>
                    ) : null}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700">Kelas (boleh lebih dari satu) *</label>
                    <div className="mt-1 max-h-44 space-y-1 overflow-y-auto rounded-lg border border-zinc-200 p-2">
                      {modalCourses.map((c) => {
                        const checked = createCourseIds.includes(c.id);
                        return (
                          <label key={c.id} className="flex cursor-pointer items-center gap-2 text-sm text-zinc-800">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) =>
                                setCreateCourseIds((prev) =>
                                  e.target.checked ? [...prev, c.id] : prev.filter((id) => id !== c.id)
                                )
                              }
                              className="h-4 w-4"
                            />
                            <span>{c.title}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700">Total harga (opsional)</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={createTotalPriceRp}
                      onChange={(e) => setCreateTotalPriceRp(e.target.value)}
                      placeholder="Kosongkan untuk hitung otomatis"
                      className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700">Tanggal pembelian *</label>
                    <input
                      type="datetime-local"
                      value={createPurchasedAtLocal}
                      onChange={(e) => setCreatePurchasedAtLocal(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-800">
                      <input
                        type="checkbox"
                        checked={verifyImmediately}
                        onChange={(e) => setVerifyImmediately(e.target.checked)}
                        className="h-4 w-4"
                      />
                      Verifikasi otomatis setelah order dibuat
                    </label>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700">Bukti pembayaran (opsional)</label>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,.pdf"
                      onChange={(e) => setCreateProofFile(e.target.files?.[0] ?? null)}
                      className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <input
                      type="text"
                      placeholder="No rekening pengirim (opsional)"
                      value={createSenderAccountNo}
                      onChange={(e) => setCreateSenderAccountNo(e.target.value)}
                      className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Nama pengirim (opsional)"
                      value={createSenderName}
                      onChange={(e) => setCreateSenderName(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                    />
                  </div>
                </>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={
                    createOrderMutation.isPending ||
                    uploadProofMutation.isPending ||
                    verifyOrderMutation.isPending ||
                    modalLoading
                  }
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                >
                  {createOrderMutation.isPending || uploadProofMutation.isPending || verifyOrderMutation.isPending
                    ? "Memproses…"
                    : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editPayment && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4 [color-scheme:light]">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-zinc-900">Ubah tanggal pembelian</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Siswa: {getPaymentUserName(editPayment)} · {formatPaymentMoney(editPayment)}
            </p>
            <form onSubmit={(e) => void handleEditSubmit(e)} className="mt-4 space-y-4">
              {editFormError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {editFormError}
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-zinc-700">Tanggal &amp; jam pembelian *</label>
                <input
                  type="datetime-local"
                  value={editPurchasedAtLocal}
                  onChange={(e) => setEditPurchasedAtLocal(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditPayment(null)}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                >
                  {updateMutation.isPending ? "Menyimpan…" : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
