"use client";

import Link from "next/link";

type GuruSidebarProps = {
  currentPath?: string;
  onLogout: () => void;
};

function NavLink({
  href,
  label,
  isActive,
}: {
  href: string;
  label: string;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium transition ${
        isActive
          ? "bg-sky-900 text-white"
          : "text-zinc-700 hover:bg-sky-50 hover:text-sky-800"
      }`}
    >
      <span>{label}</span>
      {isActive && (
        <span className="rounded-full bg-sky-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-200">
          Aktif
        </span>
      )}
    </Link>
  );
}

export function GuruSidebar({ currentPath = "", onLogout }: GuruSidebarProps) {
  const isDashboard = currentPath === "/guru" || currentPath === "/guru/";
  const isKelolaSiswa = currentPath.startsWith("/guru/kelola-siswa");
  const isKelolaKelas = currentPath.startsWith("/guru/kelola-kelas");
  const isLaporan = currentPath.startsWith("/guru/laporan");
  const isPembayaran = currentPath.startsWith("/guru/pembayaran");
  const isPengaturan = currentPath.startsWith("/guru/pengaturan");

  return (
    <aside className="hidden w-64 flex-col border-r border-sky-100 bg-white px-5 py-6 md:flex">
      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-600 text-sm font-semibold text-white">
          G
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight text-zinc-900">Dashboard Guru</p>
          <p className="text-xs text-zinc-500">Fansedu — OSN Informatika</p>
        </div>
      </div>

      <nav className="space-y-1 text-sm">
        <p className="px-2 text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500">
          Utama
        </p>
        <NavLink href="/guru" label="Dashboard" isActive={isDashboard} />

        <div className="mt-4 space-y-1">
          <p className="px-2 text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500">
            Kelola
          </p>
          <NavLink href="/guru/kelola-siswa" label="Kelola Siswa" isActive={isKelolaSiswa} />
          <NavLink href="/guru/kelola-kelas" label="Kelola Kelas" isActive={isKelolaKelas} />
        </div>

        <div className="mt-4 space-y-1">
          <p className="px-2 text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500">
            Lainnya
          </p>
          <NavLink href="/guru/laporan" label="Laporan" isActive={isLaporan} />
          <NavLink href="/guru/pembayaran" label="Riwayat Pembayaran" isActive={isPembayaran} />
          <NavLink href="/guru/pengaturan" label="Pengaturan" isActive={isPengaturan} />
        </div>
      </nav>

      <div className="mt-auto space-y-3 pt-6 text-xs">
        <button
          type="button"
          onClick={onLogout}
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-left text-xs font-medium text-zinc-700 hover:bg-zinc-100"
        >
          Keluar
        </button>
      </div>
    </aside>
  );
}
