import type { Payment } from "@/lib/api-types";

/** Tampilkan nominal (amount_cents = sen, atau amount = rupiah utuh — sesuaikan dengan backend). */
export function formatPaymentMoney(p: Payment): string {
  const amountCents =
    (p as Payment & { amountCents?: number }).amountCents ?? p.amount_cents;
  if (amountCents != null && Number.isFinite(amountCents)) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amountCents / 100);
  }
  const amount = p.amount;
  if (amount != null && Number.isFinite(amount)) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return "–";
}

export function paymentStatusLabel(status: string | undefined): string {
  const s = (status ?? "").toLowerCase();
  if (s === "pending") return "Menunggu verifikasi";
  if (s === "confirmed" || s === "completed" || s === "paid") return "Disetujui";
  if (s === "rejected" || s === "failed") return "Ditolak";
  return status || "–";
}

export function isPendingStatus(status: string | undefined): boolean {
  const s = (status ?? "").toLowerCase();
  return s === "pending" || s === "awaiting_verification" || s === "submitted";
}
