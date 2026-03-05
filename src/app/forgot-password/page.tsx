 "use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type ForgotPasswordFormState = {
  email: string;
};

export default function ForgotPasswordPage() {
  const [form, setForm] = useState<ForgotPasswordFormState>({
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { forgotPassword } = await import("@/lib/api");
      await forgotPassword({ email: form.email });
      setSent(true);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Reset your password
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {sent && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            If an account exists for that email, a reset link has been sent.
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

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-zinc-50 shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-700"
          >
            {loading ? "Sending link..." : "Send reset link"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-600">
          Remember your password?{" "}
          <Link
            href="/login"
            className="font-medium text-zinc-900 underline-offset-2 hover:underline"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

