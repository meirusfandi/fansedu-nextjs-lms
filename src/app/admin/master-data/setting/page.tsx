"use client";

export default function MasterDataSettingPage() {
  return (
    <div className="px-4 py-5 sm:px-6 md:px-8 md:py-8">
      <div className="mb-6 md:mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Master Data
        </p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
          Setting
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Pengaturan umum platform dan konfigurasi.
        </p>
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 ">
        <p className="text-sm text-zinc-500">
          Halaman setting. Tambahkan form atau opsi konfigurasi di sini.
        </p>
      </div>
    </div>
  );
}
