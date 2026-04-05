import { NextRequest, NextResponse } from "next/server";
import {
  bankDedupeKey,
  readQuestionBankFromDisk,
  writeQuestionBankToDisk,
} from "@/lib/question-bank/store";
import { mergeQuestionBankEntry, normalizeQuestionBankEntries } from "@/lib/question-bank/normalize";

export const runtime = "nodejs";

function isAdmin(request: NextRequest): boolean {
  const role = request.cookies.get("auth_role")?.value;
  const token = request.cookies.get("auth_token")?.value;
  return role === "admin" && Boolean(token);
}

function canReadQuestionBank(request: NextRequest): boolean {
  const role = request.cookies.get("auth_role")?.value;
  const token = request.cookies.get("auth_token")?.value;
  if (!token) return false;
  return role === "admin" || role === "trainer" || role === "guru";
}

/** GET — daftar semua entri bank soal (admin & trainer/guru: baca saja). */
export async function GET(request: NextRequest) {
  if (!canReadQuestionBank(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const entries = readQuestionBankFromDisk();
  return NextResponse.json({ data: entries });
}

/** POST — tambah entri (array). Duplikat source tryout + question id dilewati. */
export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const rawAdd = body?.entries ?? body?.data;
    if (!Array.isArray(rawAdd)) {
      return NextResponse.json({ error: "Body harus berisi entries: []" }, { status: 400 });
    }
    const incoming = normalizeQuestionBankEntries(rawAdd);
    if (incoming.length === 0) {
      return NextResponse.json({ error: "Tidak ada entri valid" }, { status: 400 });
    }
    const existing = readQuestionBankFromDisk();
    const keys = new Set(existing.map(bankDedupeKey));
    let added = 0;
    const merged = [...existing];
    for (const e of incoming) {
      const k = bankDedupeKey(e);
      if (keys.has(k)) continue;
      keys.add(k);
      merged.push(e);
      added += 1;
    }
    try {
      writeQuestionBankToDisk(merged);
    } catch (err) {
      console.error("question-bank write failed", err);
      return NextResponse.json(
        {
          error:
            "Gagal menulis file (environment read-only). Untuk production gunakan volume yang dapat ditulis atau API backend.",
        },
        { status: 507 }
      );
    }
    return NextResponse.json({
      ok: true,
      added,
      skipped: incoming.length - added,
      total: merged.length,
    });
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }
}

const PATCH_KEYS = [
  "type",
  "body",
  "options",
  "maxScore",
  "correctOption",
  "correctText",
  "imageUrl",
] as const;

function pickQuestionBankPatch(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of PATCH_KEYS) {
    if (Object.prototype.hasOwnProperty.call(body, k)) {
      out[k] = body[k];
    }
  }
  return out;
}

/** PUT — perbarui satu entri by body.id (admin). */
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
    const patch = pickQuestionBankPatch(body);
    const existing = readQuestionBankFromDisk();
    const idx = existing.findIndex((e) => e.id === id);
    if (idx < 0) {
      return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
    }
    const merged = mergeQuestionBankEntry(existing[idx], patch);
    if (!merged) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }
    const next = [...existing];
    next[idx] = merged;
    try {
      writeQuestionBankToDisk(next);
    } catch (err) {
      console.error("question-bank write failed", err);
      return NextResponse.json(
        {
          error:
            "Gagal menulis file (environment read-only). Untuk production gunakan volume yang dapat ditulis atau API backend.",
        },
        { status: 507 }
      );
    }
    return NextResponse.json({ ok: true, data: merged });
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }
}

/** DELETE — hapus satu entri by ?id= */
export async function DELETE(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = request.nextUrl.searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json({ error: "Parameter id wajib" }, { status: 400 });
  }
  const existing = readQuestionBankFromDisk();
  const next = existing.filter((e) => e.id !== id);
  if (next.length === existing.length) {
    return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
  }
  try {
    writeQuestionBankToDisk(next);
  } catch (err) {
    console.error("question-bank write failed", err);
    return NextResponse.json({ error: "Gagal menulis file" }, { status: 507 });
  }
  return NextResponse.json({ ok: true });
}
