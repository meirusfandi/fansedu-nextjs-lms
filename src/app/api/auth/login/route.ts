import { NextRequest, NextResponse } from "next/server";

// Proxy login ke backend Go. Pakai NEXT_PUBLIC_API_URL (khusus backend Go).
// Production: set NEXT_PUBLIC_API_URL=https://api.fansedu.web.id
function getBackendBase(): string {
  const base =
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.API_URL ??
    "http://localhost:8080";

  return base.replace(/\/$/, "");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const base = getBackendBase();
    const url = `${base}/api/v1/auth/login`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json(
      { error: "Gagal menghubungi server." },
      { status: 502 }
    );
  }
}
