"use client";

import { useState } from "react";

export default function ParentTagihanPage() {
  const [invoices] = useState([
    {
      id: "INV-2026-10-001",
      period: "Oktober 2026",
      studentName: "Ahmad Fauzi",
      course: "Bimbingan Intensif OSN Informatika (Privat)",
      tutor: "Kak Rian Maulana, S.Kom",
      totalSessions: 12,
      attendedSessions: 11,
      ratePerSession: 150000,
      totalAmount: 1650000, // 11 x 150rb
      status: "paid", // paid, pending
      paidAt: "20 Okt 2026",
      paymentMethod: "Transfer Bank BCA / Midtrans",
      notes: "Sesi izin pada 10 Okt tidak dihitung dalam tagihan les.",
    },
    {
      id: "INV-2026-09-002",
      period: "September 2026",
      studentName: "Ahmad Fauzi",
      course: "Bimbingan Intensif OSN Informatika (Privat)",
      tutor: "Kak Rian Maulana, S.Kom",
      totalSessions: 12,
      attendedSessions: 12,
      ratePerSession: 150000,
      totalAmount: 1800000,
      status: "paid",
      paidAt: "22 Sep 2026",
      paymentMethod: "Transfer Bank BCA",
      notes: "Pembayaran lunas tepat waktu.",
    },
  ]);

  const activeInvoice = invoices[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Tagihan &amp; SPP Les</h1>
          <p className="text-sm text-zinc-500">
            Transparansi rincian biaya bimbingan berdasarkan kalkulasi sesi kehadiran riil anak.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://wa.me/6285121277161?text=Halo%20Admin%20FansEdu,%20saya%20ingin%20konfirmasi%20pembayaran%20les%20anak%20saya"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100"
          >
            <span>💬 Konfirmasi WhatsApp</span>
          </a>
        </div>
      </div>

      {/* Active Month Invoice Banner */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-4 border-b border-zinc-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
              ✓ Tagihan Periode Berjalan Lunas
            </span>
            <h2 className="mt-2 text-xl font-bold text-zinc-900">Invoice #{activeInvoice.id}</h2>
            <p className="text-xs text-zinc-500">
              Periode: {activeInvoice.period} • Siswa: {activeInvoice.studentName}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs text-zinc-400">Total Biaya Sesi</p>
            <p className="text-2xl font-black text-zinc-900">
              Rp {activeInvoice.totalAmount.toLocaleString("id-ID")}
            </p>
            <p className="text-[11px] text-emerald-600 font-semibold">Dibayar pada {activeInvoice.paidAt}</p>
          </div>
        </div>

        {/* Calculation breakdown */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
            <p className="text-xs text-zinc-500">Sesi Dihadiri</p>
            <p className="mt-1 text-xl font-bold text-zinc-900">
              {activeInvoice.attendedSessions} <span className="text-xs font-normal text-zinc-500">/ {activeInvoice.totalSessions} sesi</span>
            </p>
          </div>
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
            <p className="text-xs text-zinc-500">Tarif per Sesi</p>
            <p className="mt-1 text-xl font-bold text-zinc-900">
              Rp {activeInvoice.ratePerSession.toLocaleString("id-ID")}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
            <p className="text-xs text-zinc-500">Metode Pembayaran</p>
            <p className="mt-1 text-sm font-bold text-zinc-900 line-clamp-1">
              {activeInvoice.paymentMethod}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-sky-100 bg-sky-50/50 p-4 text-xs text-sky-900">
          <span className="font-semibold">Keterangan: </span>
          <span>{activeInvoice.notes}</span>
        </div>
      </div>

      {/* History Table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs">
        <div className="border-b border-zinc-200 px-6 py-4">
          <h2 className="text-sm font-bold text-zinc-900">Riwayat Pembayaran Sebelumnya</h2>
        </div>
        <div className="divide-y divide-zinc-100">
          {invoices.map((inv) => (
            <div key={inv.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between transition hover:bg-zinc-50">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-zinc-900">#{inv.id}</span>
                  <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-600">
                    {inv.period}
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-500">{inv.course} • Pengajar: {inv.tutor}</p>
                <p className="text-[11px] text-zinc-400">
                  {inv.attendedSessions} Sesi x Rp {inv.ratePerSession.toLocaleString("id-ID")}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-bold text-zinc-900">
                    Rp {inv.totalAmount.toLocaleString("id-ID")}
                  </p>
                  <span className="inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                    Lunas
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
