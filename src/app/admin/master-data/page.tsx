"use client";

import Link from "next/link";

const MASTER_LINKS = [
  { href: "/admin/master-data/setting", title: "Setting", description: "Pengaturan umum platform dan konfigurasi." },
  { href: "/admin/master-data/role", title: "Role", description: "Role di sistem (admin, trainer, dll.)." },
  { href: "/admin/master-data/subject", title: "Subject (Kelas yang dibuka)", description: "Kelas/bidang yang saat ini dibuka per level SD, SMP, SMA." },
  { href: "/admin/master-data/sekolah", title: "Sekolah", description: "Info sekolah: nama, alamat, kontak, dll." },
  { href: "/admin/master-data/jenjang", title: "Jenjang Pendidikan", description: "SD, SMP, SMA, dan jenjang lainnya." },
  { href: "/admin/master-data/event", title: "Event", description: "Kategori event: tryout, free class, paid class, dll." },
];

export default function AdminMasterDataPage() {
  return (
    <div className="px-4 py-5 sm:px-6 md:px-8 md:py-8">
      <div className="mb-6 md:mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Master Data
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
          Konfigurasi Master Data
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Kelola setting global, role user, subject/kelas, sekolah, jenjang pendidikan, dan kategori event.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {MASTER_LINKS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300 hover:shadow"
          >
            <h2 className="font-semibold text-zinc-900">{item.title}</h2>
            <p className="mt-1 text-sm text-zinc-500">{item.description}</p>
            <span className="mt-3 inline-block text-xs font-medium text-zinc-600">
              Kelola →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
