import { NextRequest, NextResponse } from "next/server";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.BASE_URL ||
  "http://localhost:8080";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const url = `${API_BASE.replace(/\/$/, "")}/api/v1/auth/login`;
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
