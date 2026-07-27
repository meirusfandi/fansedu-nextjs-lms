"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { NavSection } from "./Sidebar";

export interface TopNavbarMobileNav {
  sections: NavSection[];
  accent?: "zinc" | "sky" | "emerald" | "violet";
}

export interface TopNavbarProps {
  title?: string;
  user?: { name: string; email?: string } | null;
  onLogout?: () => void;
  sidebarHidden?: boolean;
  onToggleSidebar?: () => void;
  /** Menu drawer untuk layar kecil (isinya sama dengan sidebar). */
  mobileNav?: TopNavbarMobileNav;
}

function mobileNavActiveClasses(accent: TopNavbarMobileNav["accent"]) {
  if (accent === "sky") return "bg-sky-900 text-white";
  if (accent === "emerald") return "bg-emerald-900 text-white";
  if (accent === "violet") return "bg-violet-900 text-white";
  return "bg-zinc-900 text-zinc-50";
}

export function TopNavbar({
  title = "Dashboard",
  user,
  onLogout,
  sidebarHidden = false,
  onToggleSidebar,
  mobileNav,
}: TopNavbarProps) {
  const pathname = usePathname() ?? "";
  const [mobileOpen, setMobileOpen] = useState(false);
  const accent = mobileNav?.accent ?? "zinc";

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-zinc-200 bg-white/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="flex items-center gap-2">
        {mobileNav && mobileNav.sections.length > 0 && (
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-100 md:hidden"
            aria-expanded={mobileOpen}
            aria-controls="dashboard-mobile-nav"
            aria-label="Buka menu navigasi"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M4 6h12M4 10h12M4 14h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="hidden h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-100 md:inline-flex"
            aria-label={sidebarHidden ? "Tampilkan sidebar" : "Sembunyikan sidebar"}
            title={sidebarHidden ? "Tampilkan sidebar" : "Sembunyikan sidebar"}
          >
            {sidebarHidden ? (
              <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
                <rect x="3" y="4" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 4V16" stroke="currentColor" strokeWidth="1.5" />
                <path d="M6 8.5L4.5 10L6 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
                <rect x="3" y="4" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 4V16" stroke="currentColor" strokeWidth="1.5" />
                <path d="M14 8.5L15.5 10L14 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        )}
        <h1 className="text-sm font-semibold text-zinc-900 md:text-base">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        {user && (
          <span className="hidden max-w-[120px] truncate text-xs text-zinc-600 sm:max-w-[180px] sm:text-sm">
            {user.name}
          </span>
        )}
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
          >
            Keluar
          </button>
        )}
        <Link
          href="/"
          className="text-xs font-medium text-zinc-500 hover:text-zinc-900"
          aria-label="Home"
        >
          Home
        </Link>
      </div>

      {mobileNav && mobileOpen && (
        <div className="fixed inset-0 z-[100] md:hidden" role="dialog" aria-modal="true" aria-label="Menu navigasi">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Tutup menu"
            onClick={() => setMobileOpen(false)}
          />
          <div
            id="dashboard-mobile-nav"
            className="absolute left-0 top-0 flex h-full w-[min(100%,18rem)] flex-col border-r border-zinc-200 bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
              <span className="text-sm font-semibold text-zinc-900">Menu</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                aria-label="Tutup"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3 text-sm">
              {mobileNav.sections.map((section, sIdx) => (
                <div key={sIdx} className={sIdx > 0 ? "mt-4" : ""}>
                  {section.title && (
                    <p className="mb-1.5 px-2 text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                      {section.title}
                    </p>
                  )}
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const isActive =
                        pathname === item.href || pathname.startsWith(item.href + "/");
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`block rounded-lg px-3 py-2 text-xs font-medium transition ${
                            isActive
                              ? mobileNavActiveClasses(accent)
                              : "text-zinc-700 hover:bg-zinc-100"
                          }`}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
