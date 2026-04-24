import { deepToCamelCase } from "@/lib/json-case";
import { NextRequest, NextResponse } from "next/server";

function getBackendBase(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? "http://localhost:8080").replace(/\/$/, "");
}

type RouteParams = { params: Promise<{ id: string }> };

/** GET /api/admin/levels/[id]/subjects — proxy ke backend: GET /api/v1/admin/levels/:id/subjects */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = request.headers.get("authorization");
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Level ID diperlukan." }, { status: 400 });
  }
  try {
    const url = `${getBackendBase()}/api/v1/admin/levels/${encodeURIComponent(id)}/subjects`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: auth,
      },
      cache: "no-store",
    });
    if (res.status === 204) return new NextResponse(null, { status: 204 });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(deepToCamelCase(data), { status: res.status });
  } catch {
    return NextResponse.json({ error: "Gagal menghubungi server." }, { status: 502 });
  }
}
