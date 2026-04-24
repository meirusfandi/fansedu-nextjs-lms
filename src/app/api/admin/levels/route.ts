import { deepToCamelCase } from "@/lib/json-case";
import { NextRequest, NextResponse } from "next/server";

function getBackendBase(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? "http://localhost:8080").replace(/\/$/, "");
}

/** GET /api/admin/levels — proxy ke backend: GET /api/v1/admin/levels */
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const url = `${getBackendBase()}/api/v1/admin/levels`;
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
