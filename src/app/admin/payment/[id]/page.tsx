"use client";

import {
  useAdminConfirmPayment,
  useAdminPaymentDetail,
  useAdminRejectPayment,
  useAdminVerifyOrder,
} from "@/hooks/useDashboardQueries";
import { adminGetOrderDetail, getFriendlyApiErrorMessage, resolveBackendUrl } from "@/lib/api";
import { formatPaymentMoney, isPendingStatus, paymentStatusLabel } from "@/lib/paymentDisplay";
import { normalizeUserRoleFromApi } from "@/lib/user-role";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function normalizeAccountType(rawRole: unknown): string {
  const normalized = normalizeUserRoleFromApi(typeof rawRole === "string" ? rawRole : "");
  if (normalized === "student") return "Siswa";
  if (normalized === "trainer") return "Guru";
  return "-";
}

function paymentTypeLabel(type: unknown): string {
  const t = typeof type === "string" ? type.toLowerCase().trim() : "";
  if (!t) return "Pembayaran";
  if (t.includes("course")) return "Pembelian Kelas";
  if (t.includes("slot")) return "Pembelian Slot";
  if (t.includes("manual")) return "Pembayaran Manual";
  if (t.includes("midtrans")) return "Pembayaran Midtrans";
  if (t.includes("transfer")) return "Transfer Bank";
  if (t.includes("subscription")) return "Langganan";
  return "Pembayaran";
}

function paymentProofUrl(payment: Record<string, unknown>): string | null {
  const direct =
    (typeof payment.proofUrl === "string" ? payment.proofUrl : null) ??
    (typeof payment.proof_url === "string" ? payment.proof_url : null) ??
    (typeof payment.paymentProofUrl === "string" ? payment.paymentProofUrl : null) ??
    (typeof payment.payment_proof_url === "string" ? payment.payment_proof_url : null) ??
    (typeof payment.transferProofUrl === "string" ? payment.transferProofUrl : null) ??
    (typeof payment.transfer_proof_url === "string" ? payment.transfer_proof_url : null);
  if (direct && String(direct).trim() !== "") return resolveBackendUrl(String(direct));
  const proofObj = payment.proof && typeof payment.proof === "object" ? (payment.proof as Record<string, unknown>) : null;
  if (proofObj) {
    const nested =
      (typeof proofObj.url === "string" ? proofObj.url : null) ??
      (typeof proofObj.proofUrl === "string" ? proofObj.proofUrl : null) ??
      (typeof proofObj.path === "string" ? proofObj.path : null);
    if (nested && String(nested).trim() !== "") return resolveBackendUrl(String(nested));
  }
  return null;
}

function asText(value: unknown): string {
  if (value == null) return "-";
  const s = String(value).trim();
  return s.length > 0 ? s : "-";
}

function formatDate(value: unknown): string {
  if (value == null) return "-";
  const s = String(value).trim();
  if (!s) return "-";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

export default function AdminPaymentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const paymentId = String(params?.id ?? "").trim();

  const {
    data: payment,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useAdminPaymentDetail(paymentId || undefined);

  const [orderDetail, setOrderDetail] = useState<Record<string, unknown> | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const confirmMutation = useAdminConfirmPayment();
  const rejectMutation = useAdminRejectPayment();
  const verifyOrderMutation = useAdminVerifyOrder();

  useEffect(() => {
    const orderId = payment?.orderId != null ? String(payment.orderId).trim() : "";
    if (!orderId) {
      setOrderDetail(null);
      return;
    }
    let cancelled = false;
    adminGetOrderDetail(orderId)
      .then((res) => {
        if (!cancelled) setOrderDetail(res);
      })
      .catch(() => {
        if (!cancelled) setOrderDetail(null);
      });
    return () => {
      cancelled = true;
    };
  }, [payment?.orderId]);

  const handleConfirm = async () => {
    if (!payment) return;
    if (!confirm("Konfirmasi pembayaran ini? Status akan menjadi disetujui.")) return;
    setActionError(null);
    try {
      const orderId = payment.orderId != null ? String(payment.orderId).trim() : "";
      if (orderId) {
        const purchasedAt = payment.paidAt ?? payment.purchasedAt ?? undefined;
        await verifyOrderMutation.mutateAsync({
          orderId,
          body: purchasedAt ? { purchasedAt: String(purchasedAt) } : {},
        });
      } else {
        await confirmMutation.mutateAsync(payment.id);
      }
      await refetch();
      router.push("/admin/payment");
    } catch (e) {
      setActionError(getFriendlyApiErrorMessage(e));
    }
  };

  const handleReject = async () => {
    if (!payment) return;
    const reason = window.prompt("Alasan penolakan (opsional). Kosongkan lalu OK untuk menolak tanpa catatan:");
    if (reason === null) return;
    setActionError(null);
    try {
      await rejectMutation.mutateAsync({ paymentId: payment.id, reason: reason.trim() || undefined });
      await refetch();
      router.push("/admin/payment");
    } catch (e) {
      setActionError(getFriendlyApiErrorMessage(e));
    }
  };

  if (!paymentId) {
    return (
      <div className="px-4 py-5 sm:px-6 md:px-8 md:py-8">
        <p className="text-sm text-red-700">ID transaksi tidak valid.</p>
        <Link href="/admin/payment" className="mt-3 inline-block text-sm text-sky-700 underline">
          Kembali ke daftar transaksi
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 py-5 sm:px-6 md:px-8 md:py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Manage</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">Detail transaksi</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Data dimuat langsung dari API (GET detail atau daftar). Order terkait ditampilkan jika ada.
          </p>
        </div>
        <Link
          href="/admin/payment"
          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Kembali
        </Link>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500 shadow-sm">
          Memuat detail transaksi...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow-sm">
          <p>{getFriendlyApiErrorMessage(error)}</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-3 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-800 hover:bg-red-100"
          >
            Coba lagi
          </button>
        </div>
      ) : !payment ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900 shadow-sm">
          <p className="font-medium">Transaksi tidak ditemukan.</p>
          <p className="mt-2 text-xs text-amber-800">
            ID mungkin salah atau pembayaran sudah dihapus. Periksa daftar pembayaran atau hubungi administrator.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void refetch()}
              disabled={isFetching}
              className="rounded-lg bg-amber-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-900 disabled:opacity-50"
            >
              {isFetching ? "Memuat…" : "Muat ulang"}
            </button>
            <Link href="/admin/payment" className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100">
              Ke daftar transaksi
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          {(() => {
            const raw = payment as Record<string, unknown>;
            const ordererName =
              (typeof raw.userName === "string" && raw.userName.trim()) ||
              (typeof raw.customerName === "string" && raw.customerName.trim()) ||
              (typeof raw.orderedByName === "string" && raw.orderedByName.trim()) ||
              (typeof raw.payerName === "string" && raw.payerName.trim()) ||
              "-";
            const ordererEmail =
              (typeof raw.userEmail === "string" && raw.userEmail.trim()) ||
              (typeof raw.customerEmail === "string" && raw.customerEmail.trim()) ||
              (typeof raw.orderedByEmail === "string" && raw.orderedByEmail.trim()) ||
              (typeof raw.payerEmail === "string" && raw.payerEmail.trim()) ||
              asText(raw.userId);
            const payerName =
              (typeof raw.payerName === "string" && raw.payerName.trim()) ||
              (typeof raw.senderName === "string" && raw.senderName.trim()) ||
              ordererName;
            const payerEmail =
              (typeof raw.payerEmail === "string" && raw.payerEmail.trim()) ||
              (typeof raw.senderEmail === "string" && raw.senderEmail.trim()) ||
              ordererEmail;
            const payerPhone =
              (typeof raw.payerPhone === "string" && raw.payerPhone.trim()) ||
              (typeof raw.senderPhone === "string" && raw.senderPhone.trim()) ||
              null;
            const proofUrl = paymentProofUrl(raw) ?? (orderDetail ? paymentProofUrl(orderDetail) : null);
            const isPending = isPendingStatus(payment.status);
            const actionBusy =
              confirmMutation.isPending || rejectMutation.isPending || verifyOrderMutation.isPending;

            return (
              <>
                <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">ID transaksi</dt>
                    <dd className="mt-1 break-all font-medium text-zinc-900">{asText(payment.id)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Status</dt>
                    <dd className="mt-1">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                          isPending
                            ? "bg-amber-100 text-amber-900"
                            : (payment.status ?? "").toLowerCase() === "rejected" ||
                                (payment.status ?? "").toLowerCase() === "failed"
                              ? "bg-red-100 text-red-800"
                              : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {paymentStatusLabel(payment.status)}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Nominal</dt>
                    <dd className="mt-1 text-zinc-900">{formatPaymentMoney(payment)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Tipe pembayaran</dt>
                    <dd className="mt-1 text-zinc-900">{paymentTypeLabel(payment.type)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Pemesan</dt>
                    <dd className="mt-1 text-zinc-900">{ordererName}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Email pemesan</dt>
                    <dd className="mt-1 text-zinc-900">{ordererEmail}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Nama pembayar</dt>
                    <dd className="mt-1 text-zinc-900">{payerName}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Email pembayar</dt>
                    <dd className="mt-1 text-zinc-900">{payerEmail}</dd>
                  </div>
                  {payerPhone ? (
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">No. HP pembayar</dt>
                      <dd className="mt-1 text-zinc-900">{payerPhone}</dd>
                    </div>
                  ) : null}
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Tipe akun</dt>
                    <dd className="mt-1 text-zinc-900">
                      {normalizeAccountType((payment as Record<string, unknown>).userRole ?? payment.payerRole)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Order ID</dt>
                    <dd className="mt-1 break-all text-zinc-900">{asText(payment.orderId)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Reference ID</dt>
                    <dd className="mt-1 break-all text-zinc-900">{asText(payment.referenceId)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Dibuat</dt>
                    <dd className="mt-1 text-zinc-900">{formatDate(payment.createdAt)}</dd>
                  </div>
                  {payment.purchasedAt ? (
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Tanggal pembelian</dt>
                      <dd className="mt-1 text-zinc-900">{formatDate(payment.purchasedAt)}</dd>
                    </div>
                  ) : null}
                  {payment.paidAt ? (
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Waktu dibayar</dt>
                      <dd className="mt-1 text-zinc-900">{formatDate(payment.paidAt)}</dd>
                    </div>
                  ) : null}
                </dl>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  {proofUrl ? (
                    <a
                      href={proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-sky-700 hover:bg-zinc-50"
                    >
                      Buka bukti pembayaran
                    </a>
                  ) : null}
                  {isPending ? (
                    <>
                      <button
                        type="button"
                        disabled={actionBusy}
                        onClick={() => void handleConfirm()}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {actionBusy ? "Memproses..." : "Setujui pembayaran"}
                      </button>
                      <button
                        type="button"
                        disabled={actionBusy}
                        onClick={() => void handleReject()}
                        className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        Tolak
                      </button>
                    </>
                  ) : null}
                </div>

                {actionError ? <p className="mt-3 text-sm text-red-700">{actionError}</p> : null}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
