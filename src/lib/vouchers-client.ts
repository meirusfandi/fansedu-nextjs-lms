import type { Voucher } from "@/lib/vouchers/types";

async function parseError(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { error?: string };
    return j?.error ?? res.statusText;
  } catch {
    return res.statusText;
  }
}

function newVoucherId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `voucher-${crypto.randomUUID()}`;
  }
  return `voucher-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export { newVoucherId };

export async function fetchVouchers(): Promise<Voucher[]> {
  const res = await fetch("/api/admin/vouchers", { credentials: "include" });
  if (!res.ok) throw new Error(await parseError(res));
  const j = (await res.json()) as { data?: Voucher[] };
  return Array.isArray(j.data) ? j.data : [];
}

export async function createVoucher(
  input: Omit<Voucher, "id" | "createdAt" | "updatedAt"> & { id?: string }
): Promise<Voucher> {
  const id = input.id?.trim() || newVoucherId();
  const res = await fetch("/api/admin/vouchers", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id,
      code: input.code,
      name: input.name,
      nominal: input.nominal,
      expiresAt: input.expiresAt,
      active: input.active,
      applicableClassIds: input.applicableClassIds ?? [],
    }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const j = (await res.json()) as { data?: Voucher };
  if (!j.data) throw new Error("Respons tidak valid");
  return j.data;
}

export async function updateVoucher(
  id: string,
  patch: Partial<
    Pick<Voucher, "code" | "name" | "nominal" | "expiresAt" | "active" | "applicableClassIds">
  >
): Promise<Voucher> {
  const res = await fetch("/api/admin/vouchers", {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...patch }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const j = (await res.json()) as { data?: Voucher };
  if (!j.data) throw new Error("Respons tidak valid");
  return j.data;
}

export async function deleteVoucher(id: string): Promise<void> {
  const res = await fetch(`/api/admin/vouchers?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(await parseError(res));
}

/** Voucher aktif dan belum lewat hari expiresAt (akhir hari tersebut masih valid). */
export function isVoucherCurrentlyValid(v: Voucher): boolean {
  if (!v.active) return false;
  const end = new Date(v.expiresAt);
  if (Number.isNaN(end.getTime())) return false;
  const endOfDay = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999);
  return Date.now() <= endOfDay.getTime();
}
