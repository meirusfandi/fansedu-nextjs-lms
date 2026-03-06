"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

const REMEMBER_EMAIL_KEY = "fansedu_login_remember_email";

type LoginFormState = {
  email: string;
  password: string;
};

function EyeIcon({ visible }: { visible: boolean }) {
  // visible = password sedang ditampilkan → tampilkan ikon "sembunyikan" (eye-off)
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
  const [form, setForm] = useState<LoginFormState>({
    email: "",
    password: "",
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(REMEMBER_EMAIL_KEY);
    if (saved) {
      setForm((f) => ({ ...f, email: saved }));
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { login: apiLogin, setAuthToken } = await import("@/lib/api");
      const res = await apiLogin({
        email: form.email,
        password: form.password,
      });
      // Backend: { user: { id, name/nama, email, role }, token }
      const { token, user } = res;
      if (!token || !user?.role) {
        setError("Format respons login tidak valid.");
        return;
      }
      const name = (user as { name?: string; nama?: string; full_name?: string }).name
        ?? (user as { name?: string; nama?: string; full_name?: string }).nama
        ?? (user as { name?: string; nama?: string; full_name?: string }).full_name
        ?? "";
      const maxAge = rememberMe ? 2592000 : 604800; // 30 hari vs 7 hari
      setAuthToken(token, maxAge, user.role, name || undefined);
      if (rememberMe && form.email) {
        localStorage.setItem(REMEMBER_EMAIL_KEY, form.email);
      } else {
        localStorage.removeItem(REMEMBER_EMAIL_KEY);
      }
      const dest = user.role === "admin" ? "/admin" : "/student";
      router.replace(dest);
    } catch (err) {
      const message =
        (err as { status?: number }).status === 401
          ? "Email atau password salah."
          : "Gagal masuk. Periksa koneksi atau coba lagi.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Sign in to continue to your dashboard.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-zinc-800"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-500 focus:border-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-900/5"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-zinc-800"
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-zinc-700 underline-offset-2 hover:underline"
              >
                Forgot password?
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
                className="block w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 pl-3 pr-10 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-500 focus:border-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-900/5"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700"
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
              className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
            />
            <span className="text-sm text-zinc-700">
              Ingat saya
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-zinc-50 shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-700"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {false && (
        <p className="mt-6 text-center text-sm text-zinc-600">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-zinc-900 underline-offset-2 hover:underline"
          >
            Create one
          </Link>
        </p>
        )}
      </div>
    </div>
  );
}

