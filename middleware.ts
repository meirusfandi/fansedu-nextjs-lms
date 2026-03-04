import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/login", "/register", "/forgot-password"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const token = request.cookies.get("auth_token")?.value;
  const role = request.cookies.get("auth_role")?.value;
  const isAuthenticated = Boolean(token);

  // Root (/) and protected routes: unauthenticated -> login; authenticated on / -> dashboard
  if (pathname === "/") {
    const dest = isAuthenticated
      ? role === "admin"
        ? "/admin"
        : "/student"
      : "/login";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  if (!isAuthenticated && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthenticated && isPublicRoute) {
    const dest = role === "admin" ? "/admin" : "/student";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Ensure root (/) is always handled for redirect to /login or dashboard
  matcher: ["/", "/((?!_next/static|_next/image|favicon.ico|api).*)"],
};

