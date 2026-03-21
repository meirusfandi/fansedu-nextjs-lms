import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const AUTH_USER_NAME_KEY = "auth_user_name";

function isPublicPath(pathname: string) {
  if (["/login", "/register", "/forgot-password", "/landing"].includes(pathname)) return true;
  if (pathname.startsWith("/tryout/")) return true;
  return false;
}

function clearAuthCookies(res: NextResponse) {
  res.cookies.set("auth_token", "", { path: "/", maxAge: 0 });
  res.cookies.set("auth_role", "", { path: "/", maxAge: 0 });
  res.cookies.set(AUTH_USER_NAME_KEY, "", { path: "/", maxAge: 0 });
}

function isTrainerRole(role: string | undefined) {
  return role === "trainer" || role === "guru";
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth_token")?.value;
  const role = request.cookies.get("auth_role")?.value;
  const isAuthenticated = Boolean(token);

  /** Akun siswa tidak memakai aplikasi ini — paksa logout + login. */
  if (isAuthenticated && role === "student") {
    const res = NextResponse.redirect(new URL("/login?reason=unsupported", request.url));
    clearAuthCookies(res);
    return res;
  }

  if (pathname === "/") {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (role === "admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    if (isTrainerRole(role)) {
      return NextResponse.redirect(new URL("/trainer/dashboard", request.url));
    }
    const res = NextResponse.redirect(new URL("/login?reason=unsupported", request.url));
    clearAuthCookies(res);
    return res;
  }

  if (!isAuthenticated && !isPublicPath(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthenticated && isPublicPath(pathname)) {
    if (role === "admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    if (isTrainerRole(role)) {
      return NextResponse.redirect(new URL("/trainer/dashboard", request.url));
    }
    const res = NextResponse.redirect(new URL("/login?reason=unsupported", request.url));
    clearAuthCookies(res);
    return res;
  }

  if (isAuthenticated && pathname.startsWith("/admin") && role !== "admin") {
    if (isTrainerRole(role)) {
      return NextResponse.redirect(new URL("/trainer/dashboard", request.url));
    }
    const res = NextResponse.redirect(new URL("/login?reason=unsupported", request.url));
    clearAuthCookies(res);
    return res;
  }

  if (
    isAuthenticated &&
    (pathname.startsWith("/trainer") || pathname.startsWith("/guru")) &&
    !isTrainerRole(role)
  ) {
    if (role === "admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    const res = NextResponse.redirect(new URL("/login?reason=unsupported", request.url));
    clearAuthCookies(res);
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
