"use client";

import Link from "next/link";

export default function GuruPembayaranPage() {
  return (
    <main className="flex flex-1 flex-col px-4 py-6 sm:px-6 md:px-8 md:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Riwayat Pembayaran</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Daftar transaksi pembayaran slot siswa.
        </p>
      </div>

      <div className="rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 p-8 text-center">
        <p className="text-sm font-medium text-zinc-600">
          Riwayat pembayaran akan menampilkan tanggal, jumlah slot, dan status konfirmasi.
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Terhubung dengan backend (mis. GET /trainer/payments) saat endpoint tersedia.
        </p>
        <Link
          href="/guru"
          className="mt-4 inline-block rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    </main>
  );
}
