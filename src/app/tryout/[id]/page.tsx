"use client";

import Link from "next/link";
import { useParams, useEffect, useState } from "next/navigation";

/**
 * Tryout siswa dipindahkan ke fansedu-landing-page (hash router LMS).
 * Set NEXT_PUBLIC_TRYOUT_LANDING_URL ke origin deployment landing, mis. https://belajar.fansedu.web.id
 */
function buildLandingTryoutUrl(tryoutId: string): string | null {
  const base = (process.env.NEXT_PUBLIC_TRYOUT_LANDING_URL ?? "").replace(/\/$/, "");
  if (!base) return null;
  return `${base}/#/student/tryout/${encodeURIComponent(tryoutId)}`;
}

export default function TryoutRedirectPage() {
  const params = useParams<{ id: string }>();
  const tryoutId = params.id as string;
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    const url = buildLandingTryoutUrl(tryoutId);
    setTarget(url);
    if (url) {
      window.location.replace(url);
    }
  }, [tryoutId]);

  if (target) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-zinc-50 to-white px-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-emerald-500" />
        <p className="mt-4 text-sm text-zinc-600">Mengalihkan ke halaman tryout…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-zinc-50 to-white px-4">
      <div className="max-w-md rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-zinc-700">
          URL situs tryout belum dikonfigurasi. Tambahkan{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs">NEXT_PUBLIC_TRYOUT_LANDING_URL</code> di environment
          LMS, atau buka aplikasi landing langsung.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-block text-sm font-medium text-zinc-800 underline underline-offset-2"
        >
          Kembali ke login
        </Link>
      </div>
    </div>
  );
}
