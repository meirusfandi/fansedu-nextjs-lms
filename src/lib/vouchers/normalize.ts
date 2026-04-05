import type { Voucher } from "./types";

export function normalizeVouchers(raw: unknown): Voucher[] {
  if (!Array.isArray(raw)) return [];
  const out: Voucher[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const id = String(o.id ?? "").trim();
    const code = String(o.code ?? "").trim().toUpperCase();
    const name = String(o.name ?? "").trim();
    if (!id || !code || !name) continue;
    const nominalRaw = o.nominal;
    const nominal =
      typeof nominalRaw === "number" && Number.isFinite(nominalRaw) && nominalRaw >= 0
        ? Math.floor(nominalRaw)
        : Number.isFinite(Number(nominalRaw)) && Number(nominalRaw) >= 0
          ? Math.floor(Number(nominalRaw))
          : 0;
    const expiresAt = String(o.expiresAt ?? "").trim();
    if (!expiresAt) continue;
    const active = o.active !== false;
    const classIds = Array.isArray(o.applicableClassIds)
      ? (o.applicableClassIds as unknown[]).map((x) => String(x ?? "").trim()).filter(Boolean)
      : [];
    out.push({
      id,
      code,
      name,
      nominal,
      expiresAt,
      active,
      applicableClassIds: classIds,
      createdAt: String(o.createdAt ?? new Date().toISOString()),
      updatedAt: String(o.updatedAt ?? new Date().toISOString()),
    });
  }
  return out;
}

export function mergeVoucher(existing: Voucher, patch: Record<string, unknown>): Voucher | null {
  const code =
    patch.code !== undefined ? String(patch.code ?? "").trim().toUpperCase() : existing.code;
  const name = patch.name !== undefined ? String(patch.name ?? "").trim() : existing.name;
  if (!code || !name) return null;
  let nominal = existing.nominal;
  if (patch.nominal !== undefined) {
    const n =
      typeof patch.nominal === "number" && Number.isFinite(patch.nominal)
        ? patch.nominal
        : Number(patch.nominal);
    if (!Number.isFinite(n) || n < 0) return null;
    nominal = Math.floor(n);
  }
  const expiresAt =
    patch.expiresAt !== undefined ? String(patch.expiresAt ?? "").trim() : existing.expiresAt;
  if (!expiresAt) return null;
  const active = patch.active !== undefined ? patch.active !== false : existing.active;
  const applicableClassIds =
    patch.applicableClassIds !== undefined
      ? Array.isArray(patch.applicableClassIds)
        ? (patch.applicableClassIds as unknown[]).map((x) => String(x ?? "").trim()).filter(Boolean)
        : existing.applicableClassIds
      : existing.applicableClassIds;
  return {
    ...existing,
    code,
    name,
    nominal,
    expiresAt,
    active,
    applicableClassIds,
    updatedAt: new Date().toISOString(),
  };
}
