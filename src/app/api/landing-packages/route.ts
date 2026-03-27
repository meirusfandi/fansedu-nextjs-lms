import { NextRequest, NextResponse } from "next/server";
import {
  filterActiveSorted,
  readLandingPackagesFromDisk,
  writeLandingPackagesToDisk,
} from "@/lib/landing-packages/store";
import { normalizeLandingPackages } from "@/lib/landing-packages/normalize";
export const runtime = "nodejs";

function isAdmin(request: NextRequest): boolean {
  const role = request.cookies.get("auth_role")?.value;
  const token = request.cookies.get("auth_token")?.value;
  return role === "admin" && Boolean(token);
}

export async function GET(request: NextRequest) {
  const all = request.nextUrl.searchParams.get("all") === "1";
  if (all && !isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const packages = readLandingPackagesFromDisk();
  const sorted = [...packages].sort((a, b) => a.sortOrder - b.sortOrder);
  if (all) {
    return NextResponse.json(sorted);
  }
  return NextResponse.json(filterActiveSorted(sorted));
}

export async function PUT(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const next = normalizeLandingPackages(body);
    try {
      writeLandingPackagesToDisk(next);
    } catch (e) {
      console.error("landing-packages write failed", e);
      return NextResponse.json(
        {
          error:
            "Gagal menulis file (mis. environment read-only). Untuk production, hubungkan ke API backend atau volume yang dapat ditulis.",
        },
        { status: 507 }
      );
    }
    return NextResponse.json({ ok: true, packages: next });
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }
}
