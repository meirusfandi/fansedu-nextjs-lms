"use client";

import type { LandingPackage } from "@/lib/api-types";
import { getLandingPackages } from "@/lib/api";
import Link from "next/link";
import { useEffect, useState } from "react";

const LANDING_URL = process.env.NEXT_PUBLIC_LANDING_URL || "#";

function formatIDR(amount: number | null | undefined): string {
  if (amount == null || !Number.isFinite(amount)) return "–";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function LandingPage() {
  const [packages, setPackages] = useState<LandingPackage[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    getLandingPackages()
      .then((data) => {
        if (!cancelled) setPackages(Array.isArray(data) ? data : []);
      })
      .catch(() => (!cancelled ? setPackages([]) : undefined));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white text-zinc-900 [color-scheme:light]">
      <div className="mx-auto max-w-5xl px-4 py-16">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">Fansedu LMS</h1>
          <p className="mt-4 text-zinc-600">
            Aplikasi web ini untuk <strong className="text-zinc-800">Admin</strong> dan{" "}
            <strong className="text-zinc-800">Trainer</strong> (pengajar). Masuk melalui halaman login untuk mengelola
            platform.
          </p>
          {LANDING_URL !== "#" ? (
            <a
              href={LANDING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-block rounded-lg bg-emerald-600 px-6 py-3 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Situs publik / informasi →
            </a>
          ) : (
            <p className="mt-6 text-sm text-zinc-500">
              Atur <code className="rounded bg-zinc-200 px-1.5 py-0.5">NEXT_PUBLIC_LANDING_URL</code> di .env untuk link
              eksternal opsional.
            </p>
          )}
          <p className="mt-8 text-sm text-zinc-500">
            <Link href="/login" className="font-medium text-zinc-800 underline-offset-2 hover:underline">
              Masuk sebagai Admin atau Trainer
            </Link>
          </p>
        </div>

        <section className="mt-16 border-t border-zinc-200 pt-12">
          <h2 className="text-center text-lg font-semibold text-zinc-900 sm:text-xl">Paket & promo</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-zinc-600">
            Daftar paket program dari backend. Admin dapat mengelola di dashboard.
          </p>

          {packages === null ? (
            <p className="mt-8 text-center text-sm text-zinc-500">Memuat paket…</p>
          ) : packages.length === 0 ? (
            <p className="mt-8 text-center text-sm text-zinc-600">
              Belum ada paket yang tersedia.
            </p>
          ) : (
            <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {packages.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 text-left shadow-sm transition hover:border-zinc-300 hover:shadow-md"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="text-base font-semibold text-zinc-900">{p.name}</h3>
                    {p.is_bundle ? (
                      <span className="shrink-0 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-800">
                        Bundle
                      </span>
                    ) : null}
                  </div>
                  {p.short_description ? (
                    <p className="mt-2 flex-1 text-sm text-zinc-600">{p.short_description}</p>
                  ) : (
                    <p className="mt-2 flex-1 text-sm text-zinc-500">—</p>
                  )}
                  <div className="mt-4">
                    {p.price_early_bird != null ? (
                      <p className="text-sm text-emerald-700">
                        Early bird: <span className="font-semibold">{formatIDR(p.price_early_bird)}</span>
                      </p>
                    ) : null}
                    <p className="text-lg font-bold text-zinc-900">{formatIDR(p.price_normal)}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span
                        className={`rounded-full px-2 py-0.5 font-medium ${
                          p.is_open === false ? "bg-zinc-200 text-zinc-700" : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {p.is_open === false ? "Tutup" : "Buka"}
                      </span>
                      {p.durasi ? (
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-medium text-zinc-700">
                          {p.durasi}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-4">
                    <Link
                      href="/login"
                      className="inline-flex rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                    >
                      Masuk untuk detail
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
