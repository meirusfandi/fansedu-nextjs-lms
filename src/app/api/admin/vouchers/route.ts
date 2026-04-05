import { NextRequest, NextResponse } from "next/server";
import { mergeVoucher } from "@/lib/vouchers/normalize";
import { readVouchersFromDisk, writeVouchersToDisk } from "@/lib/vouchers/store";
import type { Voucher } from "@/lib/vouchers/types";

export const runtime = "nodejs";

function isAdmin(request: NextRequest): boolean {
  const role = request.cookies.get("auth_role")?.value;
  const token = request.cookies.get("auth_token")?.value;
  return role === "admin" && Boolean(token);
}

function writeError507() {
  return NextResponse.json(
    {
      error:
        "Gagal menulis file (environment read-only). Untuk production gunakan volume yang dapat ditulis atau API backend.",
    },
    { status: 507 }
  );
}

/** GET — daftar voucher (admin). */
export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const list = readVouchersFromDisk();
  return NextResponse.json({ data: list });
}

/** POST — tambah satu voucher. */
export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const raw = body?.voucher ?? body;
    if (!raw || typeof raw !== "object") {
      return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
    }
    const o = raw as Record<string, unknown>;
    const id = String(o.id ?? "").trim();
    const code = String(o.code ?? "").trim().toUpperCase();
    const name = String(o.name ?? "").trim();
    if (!id || !code || !name) {
      return NextResponse.json({ error: "id, code, dan name wajib" }, { status: 400 });
    }
    const nominalN = Number(o.nominal);
    if (!Number.isFinite(nominalN) || nominalN < 0) {
      return NextResponse.json({ error: "nominal tidak valid" }, { status: 400 });
    }
    const expiresAt = String(o.expiresAt ?? "").trim();
    if (!expiresAt) {
      return NextResponse.json({ error: "expiresAt wajib" }, { status: 400 });
    }
    const existing = readVouchersFromDisk();
    if (existing.some((v) => v.code === code)) {
      return NextResponse.json({ error: "Kode voucher sudah dipakai" }, { status: 409 });
    }
    const now = new Date().toISOString();
    const voucher: Voucher = {
      id,
      code,
      name,
      nominal: Math.floor(nominalN),
      expiresAt,
      active: o.active !== false,
      applicableClassIds: Array.isArray(o.applicableClassIds)
        ? (o.applicableClassIds as unknown[]).map((x) => String(x ?? "").trim()).filter(Boolean)
        : [],
      createdAt: now,
      updatedAt: now,
    };
    try {
      writeVouchersToDisk([voucher, ...existing]);
    } catch {
      return writeError507();
    }
    return NextResponse.json({ ok: true, data: voucher });
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }
}

const PATCH_KEYS = [
  "code",
  "name",
  "nominal",
  "expiresAt",
  "active",
  "applicableClassIds",
] as const;

function pickVoucherPatch(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of PATCH_KEYS) {
    if (Object.prototype.hasOwnProperty.call(body, k)) {
      out[k] = body[k];
    }
  }
  return out;
}

/** PUT — perbarui voucher by body.id */
export async function PUT(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const id = String(body?.id ?? "").trim();
    if (!id) {
      return NextResponse.json({ error: "Field id wajib" }, { status: 400 });
    }
    const patch = pickVoucherPatch(body);
    const list = readVouchersFromDisk();
    const idx = list.findIndex((v) => v.id === id);
    if (idx < 0) {
      return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
    }
    const nextCode =
      patch.code !== undefined ? String(patch.code ?? "").trim().toUpperCase() : list[idx].code;
    const dup = list.find((v, i) => i !== idx && v.code === nextCode);
    if (dup) {
      return NextResponse.json({ error: "Kode voucher sudah dipakai" }, { status: 409 });
    }
    const merged = mergeVoucher(list[idx], patch);
    if (!merged) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }
    const next = [...list];
    next[idx] = merged;
    try {
      writeVouchersToDisk(next);
    } catch {
      return writeError507();
    }
    return NextResponse.json({ ok: true, data: merged });
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }
}

/** DELETE — hapus by ?id= */
export async function DELETE(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = request.nextUrl.searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json({ error: "Parameter id wajib" }, { status: 400 });
  }
  const list = readVouchersFromDisk();
  const next = list.filter((v) => v.id !== id);
  if (next.length === list.length) {
    return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
  }
  try {
    writeVouchersToDisk(next);
  } catch {
    return writeError507();
  }
  return NextResponse.json({ ok: true });
}
