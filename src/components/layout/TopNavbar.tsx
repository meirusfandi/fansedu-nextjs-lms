"use client";

import Link from "next/link";

export interface TopNavbarProps {
  title?: string;
  user?: { name: string; email?: string } | null;
  onLogout?: () => void;
  sidebarHidden?: boolean;
  onToggleSidebar?: () => void;
}

export function TopNavbar({
  title = "Dashboard",
  user,
  onLogout,
  sidebarHidden = false,
  onToggleSidebar,
}: TopNavbarProps) {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-zinc-200 bg-white/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="flex items-center gap-2">
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
    </header>
  );
}
