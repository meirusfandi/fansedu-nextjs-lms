"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { login as authLogin } from "@/services/auth";
import { useAuthStore } from "@/store/auth";
import { getDashboardPathForRole } from "@/hooks/useRedirectByRole";

type LoginFormState = { email: string; password: string };

function EyeIcon({ visible }: { visible: boolean }) {
  if (visible) {
    return (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
      </svg>
    );
  }
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState<LoginFormState>({ email: "", password: "" });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [returnPath, setReturnPath] = useState<string | null>(null);
  const [guruNotice, setGuruNotice] = useState(false);

  const teachSyncUrl = process.env.NEXT_PUBLIC_TEACHSYNC_URL || "http://localhost:8000";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search);
    if (p.get("session") === "expired") setSessionExpired(true);
    if (p.get("reason") === "guru_teachsync") {
      setGuruNotice(true);
      useAuthStore.getState().clearAuth();
    }
    const next = p.get("next");
    if (next && next.startsWith("/") && !next.startsWith("//")) setReturnPath(next);
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const loginRes = await authLogin(
        { email: form.email, password: form.password },
        rememberMe
      );
      const role = useAuthStore.getState().role;
      const byRole = getDashboardPathForRole(role) ?? "/student/dashboard";
      const dest = returnPath ?? byRole;
      const forcePassword =
        loginRes.mustSetPassword === true ||
        String(loginRes.nextAction ?? "").toUpperCase() === "SET_PASSWORD";
      if (forcePassword) {
        router.replace(`/set-password?next=${encodeURIComponent(dest)}`);
        return;
      }
      router.replace(dest);
    } catch (err) {
      const message = (err as Error)?.message ?? "";
      if (message.includes("Guru/Pengajar") || message.includes("TeachSync")) {
        setGuruNotice(true);
        setError(message);
        return;
      }
      const status = (err as { status?: number }).status;
      setError(status === 401 ? "Email atau password salah." : "Gagal masuk. Periksa koneksi atau coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 text-zinc-900 [color-scheme:light]">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-600">FansEdu LMS Ecosystem</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">Selamat Datang</h1>
          <p className="mt-1 text-sm text-zinc-500">Portal Siswa, Orang Tua &amp; Tim FansEdu</p>
        </div>

        {guruNotice && (
          <div className="mb-5 rounded-xl border border-teal-200 bg-teal-50/80 p-4 text-sm text-teal-950">
            <div className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-xs font-bold text-white">
                TS
              </span>
              <div className="space-y-1">
                <p className="font-semibold text-teal-900">Anda adalah Guru / Pengajar?</p>
                <p className="text-xs leading-relaxed text-teal-800">
                  Autentikasi dan pengelolaan jadwal, absensi, serta kelas les khusus guru berada di <strong>TeachSync</strong>.
                </p>
                <div className="pt-2">
                  <a
                    href={`${teachSyncUrl}/login`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-700 active:scale-95"
                  >
                    <span>Masuk ke TeachSync Guru</span>
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {sessionExpired && !error && !guruNotice && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Sesi Anda telah berakhir. Silakan masuk kembali.
          </div>
        )}

        {error && !guruNotice && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-zinc-800">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-500/10"
              placeholder="nama@email.com"
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-zinc-800">Password</label>
              <Link href="/forgot-password" className="text-xs font-medium text-sky-600 underline-offset-2 hover:underline">
                Lupa password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="block w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 pl-3 pr-10 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-500/10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700"
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                <EyeIcon visible={showPassword} />
              </button>
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-500"
            />
            <span className="text-xs text-zinc-600">Ingat sesi saya di perangkat ini</span>
          </label>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-400"
          >
            {loading ? "Memproses..." : "Masuk ke Akun"}
          </button>
        </form>

        <div className="mt-6 border-t border-zinc-100 pt-5 text-center text-xs text-zinc-500">
          <p>
            Belum punya akun?{" "}
            <Link href="/register" className="font-semibold text-sky-600 hover:underline">
              Daftar Siswa atau Orang Tua
            </Link>
          </p>
          <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-zinc-400">
            <span>Guru bimbingan?</span>
            <a href={`${teachSyncUrl}/login`} className="font-medium text-teal-700 hover:underline">
              Portal TeachSync Guru →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
