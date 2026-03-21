"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { register as authRegister } from "@/services/auth";
import { useAuthStore } from "@/store/auth";
import { getDashboardPathForRole } from "@/hooks/useRedirectByRole";

type RegisterFormState = { name: string; email: string; password: string; confirmPassword: string };

/** Backend: role `guru` dipetakan ke trainer di layanan auth. */
export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<RegisterFormState>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (form.password !== form.confirmPassword) {
      setError("Kata sandi tidak cocok.");
      return;
    }
    setLoading(true);
    try {
      await authRegister({
        name: form.name,
        email: form.email,
        password: form.password,
        role: "guru",
      });
      const role = useAuthStore.getState().role;
      const dest = getDashboardPathForRole(role) ?? "/trainer/dashboard";
      router.push(dest);
    } catch (err) {
      setError((err as Error).message || "Gagal mendaftar. Coba lagi atau gunakan email lain.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-zinc-50 to-white px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Daftar akun Trainer</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Pendaftaran untuk pengajar (trainer). Akun admin dan manajemen siswa diluar self-service ini.
          </p>
        </div>
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="name" className="block text-sm font-medium text-zinc-800">
              Nama lengkap
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              autoComplete="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-500 focus:border-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-900/5"
              placeholder="Nama Anda"
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
              className="block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-500 focus:border-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-900/5"
              placeholder="anda@contoh.com"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-zinc-800">
              Kata sandi
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-500 focus:border-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-900/5"
              placeholder="Buat kata sandi yang kuat"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-800">
              Konfirmasi kata sandi
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              className="block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-500 focus:border-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-900/5"
              placeholder="Ulangi kata sandi"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-zinc-50 shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-700"
          >
            {loading ? "Mendaftar..." : "Daftar sebagai Trainer"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-zinc-600">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-medium text-zinc-900 underline-offset-2 hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
