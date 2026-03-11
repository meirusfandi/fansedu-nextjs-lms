"use client";

import Link from "next/link";

export interface TopNavbarProps {
  title?: string;
  user?: { name: string; email?: string } | null;
  onLogout?: () => void;
}

export function TopNavbar({ title = "Dashboard", user, onLogout }: TopNavbarProps) {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-zinc-200 bg-white/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <h1 className="text-sm font-semibold text-zinc-900 md:text-base">{title}</h1>
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
