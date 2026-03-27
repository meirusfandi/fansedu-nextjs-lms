"use client";

import { Pagination, PAGE_SIZE } from "@/components/Pagination";
import { useEffect, useMemo, useState } from "react";
import {
  useAdminPayments,
  useAdminConfirmPayment,
  useAdminRejectPayment,
} from "@/hooks/useDashboardQueries";
import { getFriendlyApiErrorMessage } from "@/lib/api";
import { formatPaymentMoney, isPendingStatus, paymentStatusLabel } from "@/lib/paymentDisplay";
import type { Payment } from "@/lib/api-types";

function getPaymentCreatedAt(p: Payment): string | undefined {
  return (p as Payment & { createdAt?: string }).createdAt ?? p.created_at;
}

function getPaymentUserName(p: Payment): string {
  const x = p as Payment & { userName?: string; name?: string };
  return x.userName ?? p.user_name ?? x.name ?? "–";
}

function getPaymentUserEmail(p: Payment): string {
  const x = p as Payment & { userEmail?: string; email?: string; userId?: string };
  return x.userEmail ?? p.user_email ?? x.email ?? x.userId ?? p.user_id ?? "";
}

function getPaymentPayerRole(p: Payment): string {
  const x = p as Payment & { payerRole?: string };
  return x.payerRole ?? p.payer_role ?? (p.type?.includes("slot") ? "trainer" : "–");
}

function getPaymentProofUrl(p: Payment): string | null {
  const x = p as Payment & { proofUrl?: string | null };
  return (x.proofUrl ?? p.proof_url ?? null) as string | null;
}

export default function AdminPaymentPage() {
  const { data: payments = [], isLoading, error, refetch, isFetching } = useAdminPayments();
  const confirmMutation = useAdminConfirmPayment();
  const rejectMutation = useAdminRejectPayment();
  const [filter, setFilter] = useState<"all" | "pending">("all");
  const [page, setPage] = useState(1);

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

  const handleConfirm = async (p: Payment) => {
    if (!confirm("Konfirmasi pembayaran ini? Status akan menjadi disetujui.")) return;
    try {
      await confirmMutation.mutateAsync(p.id);
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

  return (
    <div className="px-4 py-5 sm:px-6 md:px-8 md:py-8">
      <div className="mb-6 md:mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Manage</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">Payment &amp; konfirmasi</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Verifikasi pembayaran dari trainer maupun siswa (jika tercatat di sistem). Hanya admin yang dapat
          menyetujui atau menolak.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {getFriendlyApiErrorMessage(error)}
          <button
            type="button"
            onClick={() => refetch()}
            className="ml-2 font-medium underline"
          >
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
              Pastikan backend menyediakan <code className="rounded bg-zinc-100 px-1">GET /api/v1/admin/payments</code>.
              Lihat docs: <code className="rounded bg-zinc-100 px-1">docs/PAYMENT_AND_CONFIRMATION_FLOW.md</code>
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-100 text-sm">
              <thead className="bg-zinc-50/80">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Tanggal
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Pembayar
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Peran
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Tipe
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
                {paginated.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-50/80">
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-600">
                      {getPaymentCreatedAt(p)
                        ? new Date(getPaymentCreatedAt(p) as string).toLocaleString("id-ID", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })
                        : "–"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-zinc-900">{getPaymentUserName(p)}</div>
                      <div className="text-xs text-zinc-500">{getPaymentUserEmail(p)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium capitalize text-zinc-700">
                        {getPaymentPayerRole(p)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{p.type ?? "–"}</td>
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
                ))}
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
        Endpoint backend yang diharapkan:{" "}
        <code className="rounded bg-zinc-100 px-1">POST /api/v1/admin/payments/:id/confirm</code>,{" "}
        <code className="rounded bg-zinc-100 px-1">POST /api/v1/admin/payments/:id/reject</code> (body opsional{" "}
        <code className="rounded bg-zinc-100 px-1">{"{ reason }"}</code>).
      </p>
    </div>
  );
}
