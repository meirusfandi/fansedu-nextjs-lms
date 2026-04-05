import type { AdminVoucher } from "./api-types";

/** Voucher aktif dan dalam rentang validFrom / validUntil (jika ada). */
export function isAdminVoucherCurrentlyValid(v: AdminVoucher): boolean {
  if (!v.isActive) return false;
  const now = Date.now();
  if (v.validFrom != null && String(v.validFrom).trim() !== "") {
    const from = new Date(v.validFrom).getTime();
    if (!Number.isNaN(from) && now < from) return false;
  }
  if (v.validUntil != null && String(v.validUntil).trim() !== "") {
    const until = new Date(v.validUntil).getTime();
    if (!Number.isNaN(until) && now > until) return false;
  }
  return true;
}

export function formatDiscountDisplay(v: Pick<AdminVoucher, "discountType" | "discountValue">): string {
  if (v.discountType === "percent") {
    return `${v.discountValue}%`;
  }
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(v.discountValue);
}

/** datetime-local value dari ISO RFC3339 (potong detik). */
export function isoToDatetimeLocal(iso: string | null | undefined): string {
  if (iso == null || String(iso).trim() === "") return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Dari input datetime-local ke ISO (UTC) untuk body API. Kosong → null */
export function datetimeLocalToIsoOrNull(s: string): string | null {
  const t = s.trim();
  if (!t) return null;
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}
