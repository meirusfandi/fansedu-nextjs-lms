"use client";

import Link from "next/link";

type AdminSidebarProps = {
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
          ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
          : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
      }`}
    >
      <span>{label}</span>
      {isActive && (
        <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-300 dark:bg-zinc-200 dark:text-zinc-800">
          Active
        </span>
      )}
    </Link>
  );
}

const MASTER_DATA_SUB = [
  { href: "/admin/master-data/setting", label: "Setting" },
  { href: "/admin/master-data/role", label: "Role" },
  { href: "/admin/master-data/subject", label: "Subject" },
  { href: "/admin/master-data/sekolah", label: "Sekolah" },
  { href: "/admin/master-data/jenjang", label: "Jenjang Pendidikan" },
  { href: "/admin/master-data/event", label: "Event / Tryout" },
] as const;

export function AdminSidebar({ currentPath = "", onLogout }: AdminSidebarProps) {
  const isDashboard = currentPath === "/admin" || currentPath === "/admin/";
  const isMasterData = currentPath.startsWith("/admin/master-data");
  const isMasterDataRoot = currentPath === "/admin/master-data" || currentPath === "/admin/master-data/";
  const isUsers = currentPath.startsWith("/admin/users");
  const isKelas = currentPath.startsWith("/admin/kelas");
  const isTryouts = currentPath.startsWith("/admin/tryouts");
  const isPayment = currentPath.startsWith("/admin/payment");
  const isReport = currentPath.startsWith("/admin/report");

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
        <NavLink href="/admin" label="Dashboard" isActive={isDashboard} />

        <div className="mt-4 space-y-1">
          <p className="px-2 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            Manage
          </p>
          <NavLink href="/admin/master-data" label="Master Data" isActive={isMasterDataRoot} />
          {isMasterData && (
            <div className="ml-3 mt-1 space-y-0.5 border-l border-zinc-200 pl-2 dark:border-zinc-700">
              {MASTER_DATA_SUB.map(({ href, label }) => (
                <NavLink
                  key={href}
                  href={href}
                  label={label}
                  isActive={
                    currentPath === href ||
                    currentPath === href + "/" ||
                    currentPath.startsWith(href + "/")
                  }
                />
              ))}
            </div>
          )}
          <NavLink href="/admin/users" label="Management User" isActive={isUsers} />
          <NavLink href="/admin/kelas" label="Management Kelas" isActive={isKelas} />
          <NavLink href="/admin/tryouts" label="Tryout" isActive={isTryouts} />
          <NavLink href="/admin/payment" label="Payment" isActive={isPayment} />
          <NavLink href="/admin/report" label="Report" isActive={isReport} />
        </div>
      </nav>

      <div className="mt-auto space-y-3 pt-6 text-xs">
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
          <p className="font-medium">Today</p>
          <p className="mt-1 text-[11px]">
            Ringkasan aktivitas platform
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
