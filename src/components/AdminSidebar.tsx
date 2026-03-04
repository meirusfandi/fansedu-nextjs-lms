"use client";

import Link from "next/link";

type AdminSidebarProps = {
  currentPath?: string;
  onLogout: () => void;
};

export function AdminSidebar({ currentPath = "", onLogout }: AdminSidebarProps) {
  const isDashboard = currentPath === "/admin" || currentPath === "/admin/";
  const isTryouts = currentPath.startsWith("/admin/tryouts");
  const isUsers = currentPath.startsWith("/admin/users");
  const isBidang = currentPath.startsWith("/admin/bidang");

  return (
    <aside className="hidden w-64 flex-col border-r border-zinc-200 bg-white/80 px-5 py-6 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80 md:flex">
      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-zinc-900 text-sm font-semibold text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900">
          FE
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight">FansEdu LMS</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Admin dashboard
          </p>
        </div>
      </div>

      <nav className="space-y-1 text-sm">
        <p className="px-2 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
          Overview
        </p>
        <Link
          href="/admin"
          className={`mt-1 flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition ${
            isDashboard
              ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
              : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
          }`}
        >
          <span>Dashboard</span>
          {isDashboard && (
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-300 dark:bg-zinc-200 dark:text-zinc-800">
              Active
            </span>
          )}
        </Link>

        <div className="mt-4 space-y-1">
          <p className="px-2 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            Manage
          </p>
          <Link
            href="/admin/tryouts"
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium transition ${
              isTryouts
                ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
            }`}
          >
            <span>Tryout</span>
            {isTryouts && (
              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-300 dark:bg-zinc-200 dark:text-zinc-800">
                Active
              </span>
            )}
          </Link>
          <Link
            href="/admin/users"
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium transition ${
              isUsers
                ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
            }`}
          >
            <span>Management User</span>
            {isUsers && (
              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-300 dark:bg-zinc-200 dark:text-zinc-800">
                Active
              </span>
            )}
          </Link>
          <Link
            href="/admin/bidang"
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium transition ${
              isBidang
                ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
            }`}
          >
            <span>Course / Module</span>
            {isBidang && (
              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-300 dark:bg-zinc-200 dark:text-zinc-800">
                Active
              </span>
            )}
          </Link>
          <button className="w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900">
            Reports
          </button>
        </div>
      </nav>

      <div className="mt-auto space-y-3 pt-6 text-xs">
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
          <p className="font-medium">Today</p>
          <p className="mt-1 text-[11px]">
            42 new enrollments · 6 certificates issued
          </p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-left text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          Keluar (ke login)
        </button>
      </div>
    </aside>
  );
}
