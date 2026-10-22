import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const AUTH_USER_NAME_KEY = "auth_user_name";

function isPublicPath(pathname: string) {
  if (["/login", "/register", "/forgot-password", "/landing"].includes(pathname)) return true;
  if (pathname.startsWith("/tryout/")) return true;
  if (pathname.startsWith("/rapor/")) return true;
  if (pathname.startsWith("/tagihan/")) return true;
  return false;
}

function clearAuthCookies(res: NextResponse) {
  res.cookies.set("auth_token", "", { path: "/", maxAge: 0 });
  res.cookies.set("auth_role", "", { path: "/", maxAge: 0 });
  res.cookies.set(AUTH_USER_NAME_KEY, "", { path: "/", maxAge: 0 });
}

function isTeacherRole(role: string | undefined) {
  const r = (role ?? "").toLowerCase();
  return r === "trainer" || r === "guru" || r === "teacher";
}

function isAdminRole(role: string | undefined) {
  const r = (role ?? "").toLowerCase();
  return r === "admin" || r === "super_admin" || r === "superadmin";
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth_token")?.value;
  const role = request.cookies.get("auth_role")?.value?.toLowerCase();
  const isAuthenticated = Boolean(token);

  // 1. Akun Guru / Trainer DITOLAK di LMS — harus menggunakan portal TeachSync
  if (isAuthenticated && isTeacherRole(role)) {
    const res = NextResponse.redirect(new URL("/login?reason=guru_teachsync", request.url));
    clearAuthCookies(res);
    return res;
  }

  // 2. Akses ke Root '/'
  if (pathname === "/") {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (isAdminRole(role)) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    if (role === "student") {
      return NextResponse.redirect(new URL("/student/dashboard", request.url));
    }
    if (role === "parent") {
      return NextResponse.redirect(new URL("/parent/dashboard", request.url));
    }
    const res = NextResponse.redirect(new URL("/login?reason=unsupported", request.url));
    clearAuthCookies(res);
    return res;
  }

  // 3. User belum login dan mengakses halaman yang dilindungi
  if (!isAuthenticated && !isPublicPath(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 4. User sudah login dan mengakses halaman publik (login/register)
  if (isAuthenticated && isPublicPath(pathname)) {
    if (isAdminRole(role)) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    if (role === "student") {
      return NextResponse.redirect(new URL("/student/dashboard", request.url));
    }
    if (role === "parent") {
      return NextResponse.redirect(new URL("/parent/dashboard", request.url));
    }
  }

  // 5. Pembatasan Role: Area Admin (/admin/*)
  if (isAuthenticated && pathname.startsWith("/admin") && !isAdminRole(role)) {
    if (role === "student") {
      return NextResponse.redirect(new URL("/student/dashboard", request.url));
    }
    if (role === "parent") {
      return NextResponse.redirect(new URL("/parent/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 6. Pembatasan Role: Area Siswa (/student/*)
  if (isAuthenticated && pathname.startsWith("/student") && role !== "student" && !isAdminRole(role)) {
    if (role === "parent") {
      return NextResponse.redirect(new URL("/parent/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 7. Pembatasan Role: Area Orang Tua (/parent/*)
  if (isAuthenticated && pathname.startsWith("/parent") && role !== "parent" && !isAdminRole(role)) {
    if (role === "student") {
      return NextResponse.redirect(new URL("/student/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 8. Halaman legacy trainer/guru di LMS diarahkan ke TeachSync notice
  if (pathname.startsWith("/trainer") || pathname.startsWith("/guru")) {
    return NextResponse.redirect(new URL("/login?reason=guru_teachsync", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
