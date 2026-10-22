"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { register as authRegister } from "@/services/auth";
import { useAuthStore } from "@/store/auth";
import { getDashboardPathForRole } from "@/hooks/useRedirectByRole";

type RegisterFormState = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: "student" | "parent";
};

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<RegisterFormState>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const teachSyncUrl = process.env.NEXT_PUBLIC_TEACHSYNC_URL || "http://localhost:8000";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (form.password !== form.confirmPassword) {
      setError("Kata sandi tidak cocok.");
      return;
    }
    setLoading(true);
    try {
      const regRes = await authRegister({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
      });
      const role = useAuthStore.getState().role;
      const dest = getDashboardPathForRole(role) ?? (form.role === "parent" ? "/parent/dashboard" : "/student/dashboard");
      const forcePassword =
        regRes.mustSetPassword === true ||
        String(regRes.nextAction ?? "").toUpperCase() === "SET_PASSWORD";
      if (forcePassword) {
        router.replace(`/set-password?next=${encodeURIComponent(dest)}`);
        return;
      }
      router.push(dest);
    } catch (err) {
      setError((err as Error).message || "Gagal mendaftar. Coba lagi atau gunakan email lain.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-8 text-zinc-900 [color-scheme:light]">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-600">FansEdu LMS</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">Buat Akun Baru</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Daftar untuk Siswa dan Orang Tua / Wali Murid
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-zinc-800">
              Tipe Pengguna
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, role: "student" })}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-semibold transition ${
                  form.role === "student"
                    ? "border-sky-600 bg-sky-50 text-sky-800"
                    : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                <span>🎓 Siswa</span>
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, role: "parent" })}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-semibold transition ${
                  form.role === "parent"
                    ? "border-sky-600 bg-sky-50 text-sky-800"
                    : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                <span>👨‍👩‍👧 Orang Tua / Wali</span>
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="name" className="block text-sm font-medium text-zinc-800">
              {form.role === "parent" ? "Nama Lengkap Orang Tua / Wali" : "Nama Lengkap Siswa"}
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              autoComplete="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-500/10"
              placeholder="Contoh: Budi Santoso"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-zinc-800">
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
              className="block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-500/10"
              placeholder="nama@email.com"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-zinc-800">
              Kata Sandi
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-500/10"
              placeholder="Minimal 8 karakter"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-800">
              Konfirmasi Kata Sandi
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              className="block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-500/10"
              placeholder="Ulangi kata sandi"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-400"
          >
            {loading ? "Mendaftarkan..." : `Daftar sebagai ${form.role === "parent" ? "Orang Tua" : "Siswa"}`}
          </button>
        </form>

        <div className="mt-6 border-t border-zinc-100 pt-5 text-center text-xs text-zinc-500">
          <p>
            Sudah punya akun?{" "}
            <Link href="/login" className="font-semibold text-sky-600 hover:underline">
              Masuk
            </Link>
          </p>
          <div className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-teal-50 p-2 text-[11px] text-teal-800">
            <span>Pengajar / Guru Les?</span>
            <a href={`${teachSyncUrl}/register`} className="font-semibold text-teal-900 underline hover:text-teal-700">
              Daftar di TeachSync Guru
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
