"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  useCreateAiSubscription,
  useMyAiSubscription,
  useTrainerPayments,
} from "@/hooks/useDashboardQueries";
import { getFriendlyApiErrorMessage } from "@/lib/api";
import type { Subscription } from "@/lib/api-types";

function fmtIso(iso: string): string {
  if (!iso?.trim()) return "–";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

function subscriptionLooksActive(s: Subscription): boolean {
  const st = s.status.toLowerCase();
  if (st.includes("active") || st === "paid" || st === "running" || st === "trialing") return true;
  const end = s.endAt ? new Date(s.endAt).getTime() : NaN;
  return Number.isFinite(end) && end > Date.now();
}

const PLAN_PRESETS = [
  { code: "pro_monthly", label: "Pro bulanan" },
  { code: "pro_yearly", label: "Pro tahunan" },
  { code: "basic_monthly", label: "Basic bulanan" },
];

export default function GuruBerlanggananAiPage() {
  const { data: subscription, isLoading, error, refetch, isFetching } = useMyAiSubscription();
  const createSub = useCreateAiSubscription();
  const { data: payments = [] } = useTrainerPayments();

  const [planCode, setPlanCode] = useState("pro_monthly");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [formMsg, setFormMsg] = useState<string | null>(null);

  const active = subscription ? subscriptionLooksActive(subscription) : false;

  const pendingPayments = useMemo(
    () => payments.filter((p) => String(p.status ?? "").toLowerCase().includes("pending")),
    [payments]
  );

  const toIso = (localValue: string): string => {
    const raw = localValue.trim();
    if (!raw) return "";
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString();
  };

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault();
    setFormMsg(null);
    const startIso = toIso(startAt);
    const endIso = toIso(endAt);
    try {
      await createSub.mutateAsync({
        planCode: planCode.trim(),
        ...(startIso ? { startAt: startIso } : {}),
        ...(endIso ? { endAt: endIso } : {}),
      });
      setFormMsg("Langganan berhasil disimpan. Status di bawah memakai data terbaru dari server.");
    } catch (err) {
      setFormMsg(getFriendlyApiErrorMessage(err));
    }
  }

  return (
    <main className="flex flex-1 flex-col px-4 py-6 sm:px-6 md:px-8 md:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Berlangganan AI</h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-600">
          Fitur bank soal &amp; analisis AI mengikuti langganan di akun Anda (
          <span className="font-mono text-xs">GET/POST /api/v1/subscription</span>
          ). Alur pembayaran (transfer, Midtrans, dll.) mengikuti kebijakan backend—cek juga{" "}
          <Link href="/guru/pembayaran" className="font-medium text-sky-700 underline hover:text-sky-900">
            riwayat pembayaran
          </Link>
          .
        </p>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {getFriendlyApiErrorMessage(error)}
          <button type="button" onClick={() => void refetch()} className="ml-2 font-medium underline">
            Muat ulang
          </button>
        </div>
      ) : null}

      <section className="mb-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-sm font-semibold text-zinc-900">Status langganan</h2>
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="rounded-lg border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            {isFetching ? "Memuat…" : "Segarkan"}
          </button>
        </div>
        {isLoading ? (
          <p className="mt-3 text-sm text-zinc-500">Memuat data langganan…</p>
        ) : !subscription ? (
          <p className="mt-3 text-sm text-zinc-600">
            Belum ada langganan aktif yang dikembalikan server, atau endpoint belum mengembalikan data
            (404). Setelah pembayaran diverifikasi atau admin mengaktifkan paket, cek lagi di sini.
          </p>
        ) : (
          <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <li>
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Paket</span>
              <p className="font-mono text-zinc-900">{subscription.planCode || "–"}</p>
            </li>
            <li>
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Status</span>
              <p className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                    active ? "bg-emerald-100 text-emerald-900" : "bg-zinc-100 text-zinc-700"
                  }`}
                >
                  {subscription.status || "—"}
                </span>
                {!active && subscription.endAt ? (
                  <span className="text-xs text-zinc-500">Berakhir: {fmtIso(subscription.endAt)}</span>
                ) : null}
              </p>
            </li>
            <li>
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Mulai</span>
              <p className="text-zinc-800">{fmtIso(subscription.startAt)}</p>
            </li>
            <li>
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Berakhir</span>
              <p className="text-zinc-800">{fmtIso(subscription.endAt)}</p>
            </li>
          </ul>
        )}
      </section>

      <section className="mb-6 rounded-2xl border border-sky-100 bg-sky-50/60 p-5">
        <h2 className="text-sm font-semibold text-zinc-900">Pembayaran</h2>
        <p className="mt-1 text-sm text-zinc-700">
          Untuk slot siswa, gunakan alur <strong>Bayar slot</strong> di Kelola Siswa. Untuk invoice lain
          (paket AI, kelas, dll.), pantau status di riwayat pembayaran—admin biasanya mengonfirmasi di
          menu Payment.
        </p>
        {pendingPayments.length > 0 ? (
          <p className="mt-2 text-sm text-amber-900">
            Anda memiliki{" "}
            <strong>
              {pendingPayments.length} pembayaran menunggu verifikasi
            </strong>
            . Setelah disetujui, langganan AI dapat terhubung otomatis tergantung konfigurasi backend.
          </p>
        ) : null}
        <Link
          href="/guru/pembayaran"
          className="mt-3 inline-block text-sm font-medium text-sky-800 underline hover:text-sky-950"
        >
          Buka riwayat pembayaran →
        </Link>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-900">Aktivasi / perpanjang (POST subscription)</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Dipakai bila backend mengizinkan aktivasi langsung (mis. uji coba, voucher, atau setelah admin
          menyetujui pembayaran secara manual). Paket umum bisa dipilih cepat di bawah.
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {PLAN_PRESETS.map((p) => (
            <button
              key={p.code}
              type="button"
              onClick={() => setPlanCode(p.code)}
              className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${
                planCode === p.code
                  ? "border-sky-600 bg-sky-50 text-sky-900"
                  : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleActivate} className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-zinc-600">planCode</label>
            <input
              value={planCode}
              onChange={(e) => setPlanCode(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              placeholder="pro_monthly"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">Mulai (opsional)</label>
            <input
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">Berakhir (opsional)</label>
            <input
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={createSub.isPending || !planCode.trim()}
              className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800 disabled:opacity-50"
            >
              {createSub.isPending ? "Mengirim…" : "Kirim aktivasi"}
            </button>
          </div>
        </form>
        {formMsg ? <p className="mt-3 text-sm text-zinc-800">{formMsg}</p> : null}
      </section>

      <Link href="/guru" className="mt-8 inline-block text-sm font-medium text-sky-600 hover:underline">
        ← Kembali ke dashboard
      </Link>
    </main>
  );
}
