"use client";

import Link from "next/link";
import { Pagination, PAGE_SIZE } from "@/components/Pagination";
import { useEffect, useMemo, useState } from "react";
import { useTrainerPayments } from "@/hooks/useDashboardQueries";
import { getFriendlyApiErrorMessage } from "@/lib/api";
import { formatPaymentMoney, paymentStatusLabel } from "@/lib/paymentDisplay";

export default function GuruPembayaranPage() {
  const { data: payments = [], isLoading, error, refetch } = useTrainerPayments();
  const [page, setPage] = useState(1);

  const paginated = useMemo(
    () => payments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [payments, page]
  );

  useEffect(() => {
    if (payments.length > 0 && (page - 1) * PAGE_SIZE >= payments.length) {
      setPage(1);
    }
  }, [payments.length, page]);

  return (
    <main className="flex flex-1 flex-col px-4 py-6 sm:px-6 md:px-8 md:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Riwayat pembayaran</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Transaksi Anda (mis. pembayaran slot peserta). Status <strong>Menunggu verifikasi</strong> berarti admin
          belum mengonfirmasi; setelah disetujui, slot biasanya bertambah sesuai kebijakan backend.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {getFriendlyApiErrorMessage(error)}
          <button type="button" onClick={() => refetch()} className="ml-2 font-medium underline">
            Coba lagi
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="p-10 text-center text-sm text-zinc-500">Memuat…</div>
        ) : payments.length === 0 ? (
          <div className="p-10 text-center text-sm text-zinc-600">
            Belum ada riwayat pembayaran tercatat. Data diambil dari{" "}
            <code className="rounded bg-zinc-100 px-1 text-xs">GET /trainer/payments</code> atau{" "}
            <code className="rounded bg-zinc-100 px-1 text-xs">GET /payments</code>.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-100 text-sm">
              <thead className="bg-zinc-50/80">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-zinc-500">Tanggal</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-zinc-500">Tipe</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-zinc-500">Nominal</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-zinc-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-zinc-500">Bukti</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {paginated.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-50/80">
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-600">
                      {p.created_at
                        ? new Date(p.created_at).toLocaleString("id-ID", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })
                        : "–"}
                    </td>
                    <td className="px-4 py-3 text-zinc-800">{p.type ?? "–"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-zinc-900">
                      {formatPaymentMoney(p)}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-zinc-700">{paymentStatusLabel(p.status)}</td>
                    <td className="px-4 py-3">
                      {p.proof_url ? (
                        <a
                          href={String(p.proof_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sky-600 hover:underline"
                        >
                          Lihat
                        </a>
                      ) : (
                        <span className="text-zinc-400">–</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!isLoading && payments.length > 0 && (
          <Pagination
            currentPage={page}
            totalItems={payments.length}
            onPageChange={setPage}
            label="transaksi"
          />
        )}
      </div>

      <p className="mt-6 text-xs text-zinc-500">
        Konfirmasi pembayaran hanya dilakukan oleh <strong>Admin</strong> di menu Payment. Trainer hanya melihat
        status.
      </p>

      <Link
        href="/guru"
        className="mt-6 inline-block text-sm font-medium text-sky-600 hover:underline"
      >
        ← Kembali ke dashboard trainer
      </Link>
    </main>
  );
}
