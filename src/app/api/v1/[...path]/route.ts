import { NextRequest, NextResponse } from "next/server";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.BASE_URL ||
  "http://localhost:8080";

async function forward(request: NextRequest, pathSegments: string[]) {
  const path = pathSegments.join("/");
  const url = `${API_BASE.replace(/\/$/, "")}/v1/${path}`;
  const method = request.method;

  const headers: Record<string, string> = {
    "Content-Type": request.headers.get("content-type") || "application/json",
  };
  const auth = request.headers.get("authorization");
  if (auth) headers["Authorization"] = auth;

  let body: string | undefined;
  if (method !== "GET" && method !== "HEAD") {
    body = await request.text();
  }

  const res = await fetch(url, { method, headers, body });
  if (res.status === 204) return new NextResponse(null, { status: 204 });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
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
