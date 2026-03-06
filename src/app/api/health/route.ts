import { NextResponse } from "next/server";

/** Health check untuk proxy/load balancer. GET /api/health → 200 */
export async function GET() {
  return NextResponse.json(
    { status: "ok", service: "fansedu-lms", time: new Date().toISOString() },
    { status: 200 }
  );
}
