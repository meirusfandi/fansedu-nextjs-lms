"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthStore } from "@/store/auth";
import { logout } from "@/services/auth";

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [selectedChild, setSelectedChild] = useState("Ahmad Fauzi (Kelas X - OSN Informatika)");

  const navItems = [
    { label: "Ringkasan", href: "/parent/dashboard", icon: "📊" },
    { label: "Kehadiran Les", href: "/parent/kehadiran", icon: "📅" },
    { label: "E-Raport & Nilai", href: "/parent/rapor", icon: "📝" },
    { label: "Tagihan & SPP", href: "/parent/tagihan", icon: "💳" },
  ];

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 text-zinc-900 [color-scheme:light]">
      {/* Top Navbar Orang Tua */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 font-bold text-white shadow-sm">
              FE
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-zinc-900">FansEdu</span>
                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-800">
                  Portal Orang Tua
                </span>
              </div>
              <p className="text-xs text-zinc-500">Pantau Pembelajaran &amp; Perkembangan Anak</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Child Selector */}
            <div className="hidden sm:flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-700">
              <span className="text-zinc-400">Anak:</span>
              <select
                value={selectedChild}
                onChange={(e) => setSelectedChild(e.target.value)}
                className="bg-transparent font-medium text-zinc-900 outline-none cursor-pointer"
              >
                <option value="Ahmad Fauzi (Kelas X - OSN Informatika)">Ahmad Fauzi (SMA - OSN Informatika)</option>
                <option value="Nadia Salsabila (Kelas VIII - Mat SMP)">Nadia Salsabila (SMP - Matematika)</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pl-2 border-l border-zinc-200">
              <div className="text-right hidden md:block">
                <p className="text-xs font-semibold text-zinc-800">{user?.name || "Wali Murid"}</p>
                <p className="text-[10px] text-zinc-500">{user?.email || "ortu@fansedu.id"}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-zinc-200 p-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 hover:text-red-600 transition"
                title="Keluar"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="border-t border-zinc-100 bg-white">
          <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-1.5 sm:px-6 lg:px-8">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    active
                      ? "bg-sky-50 text-sky-700 font-semibold"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-4 text-center text-xs text-zinc-400">
        FansEdu Ecosystem &copy; 2026. Menghubungkan Guru, Siswa &amp; Orang Tua.
      </footer>
    </div>
  );
}
