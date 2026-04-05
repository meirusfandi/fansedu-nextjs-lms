import { deepToCamelCase } from "@/lib/json-case";
import { NextRequest, NextResponse } from "next/server";

// Backend Go. NEXT_PUBLIC_API_URL = https://api.fansedu.web.id (production).
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

async function forward(request: NextRequest, pathSegments: string[]) {
  const path = pathSegments.join("/");
  const url = `${API_BASE.replace(/\/$/, "")}/api/v1/${path}`;
  const method = request.method;

  const contentType = request.headers.get("content-type") || "application/json";
  const headers: Record<string, string> = {
    "Content-Type": contentType,
  };
  const auth = request.headers.get("authorization");
  if (auth) headers["Authorization"] = auth;

  let body: string | undefined;
  if (method !== "GET" && method !== "HEAD") {
    const raw = await request.text();
    if (raw.trim() && contentType.includes("application/json")) {
      try {
        const parsed = JSON.parse(raw) as unknown;
        body = JSON.stringify(deepToCamelCase(parsed));
      } catch {
        body = raw;
      }
    } else {
      body = raw || undefined;
    }
  }

  const res = await fetch(url, { method, headers, body });
  if (res.status === 204) return new NextResponse(null, { status: 204 });
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const buf = await res.arrayBuffer();
    return new NextResponse(buf, { status: res.status, headers: { "Content-Type": ct || "application/octet-stream" } });
  }
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(deepToCamelCase(data), { status: res.status });
}

type RouteParams = { params: Promise<{ path: string[] }> };

/** Tangani preflight OPTIONS agar tidak 405 Method Not Allowed. */
export async function OPTIONS(_request: NextRequest, _params: RouteParams) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { path } = await params;
  return forward(request, path);
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { path } = await params;
  return forward(request, path);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { path } = await params;
  return forward(request, path);
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { path } = await params;
  return forward(request, path);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { path } = await params;
  return forward(request, path);
}
