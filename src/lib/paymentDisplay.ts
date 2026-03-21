import type { Payment } from "@/lib/api-types";

/** Tampilkan nominal (amount_cents = sen, atau amount = rupiah utuh — sesuaikan dengan backend). */
export function formatPaymentMoney(p: Payment): string {
  if (p.amount_cents != null && Number.isFinite(p.amount_cents)) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(p.amount_cents / 100);
  }
  if (p.amount != null && Number.isFinite(p.amount)) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(p.amount);
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
