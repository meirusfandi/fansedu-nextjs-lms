"use client";

import Link from "next/link";

export interface NavItem {
  href: string;
  label: string;
  active?: boolean;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

interface SidebarNavLinkProps {
  href: string;
  label: string;
  isActive: boolean;
  accent?: "zinc" | "sky" | "emerald" | "violet";
}

function SidebarNavLink({ href, label, isActive, accent = "zinc" }: SidebarNavLinkProps) {
  const baseInactive = "text-zinc-700";
  const activeZinc = "bg-zinc-900 text-zinc-50";
  const activeSky = "bg-sky-900 text-white";
  const activeEmerald = "bg-emerald-900 text-white";
  const activeViolet = "bg-violet-900 text-white";
  const badgeZinc = "bg-zinc-800 text-zinc-300";
  const badgeSky = "bg-sky-800 text-sky-200";
  const badgeEmerald = "bg-emerald-800 text-emerald-200";
  const badgeViolet = "bg-violet-800 text-violet-200";
  const hoverZinc = "hover:bg-zinc-100";
  const hoverSky = "hover:bg-sky-50 hover:text-sky-800";
  const hoverEmerald = "hover:bg-emerald-50 hover:text-emerald-800";
  const hoverViolet = "hover:bg-violet-50 hover:text-violet-800";

  const activeClass =
    accent === "sky" ? activeSky : accent === "emerald" ? activeEmerald : accent === "violet" ? activeViolet : activeZinc;
  const badgeClass =
    accent === "sky" ? badgeSky : accent === "emerald" ? badgeEmerald : accent === "violet" ? badgeViolet : badgeZinc;
  const hoverClass =
    accent === "sky" ? hoverSky : accent === "emerald" ? hoverEmerald : accent === "violet" ? hoverViolet : hoverZinc;

  return (
    <Link
      href={href}
      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium transition ${
        isActive ? activeClass : `${baseInactive} ${hoverClass}`
      }`}
    >
      <span>{label}</span>
      {isActive && (
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badgeClass}`}>
          Active
        </span>
      )}
    </Link>
  );
}

export interface SidebarProps {
  currentPath?: string;
  sections: NavSection[];
  onLogout: () => void;
  title?: string;
  subtitle?: string;
  logoLetter?: string;
  accent?: "zinc" | "sky" | "emerald" | "violet";
  footer?: React.ReactNode;
}

export function Sidebar({
  currentPath = "",
  sections,
  onLogout,
  title = "Fansedu",
  subtitle = "Informatic Olympiad Academy",
  logoLetter = "F",
  accent = "zinc",
  footer,
}: SidebarProps) {
  const borderClass =
    accent === "zinc"
      ? "border-zinc-200 bg-white/80"
      : accent === "sky"
        ? "border-sky-100 bg-white"
        : accent === "emerald"
          ? "border-emerald-100 bg-white"
          : "border-violet-100 bg-white";
  const logoClass =
    accent === "zinc"
      ? "bg-zinc-900 text-zinc-50"
      : accent === "sky"
        ? "bg-sky-600 text-white"
        : accent === "emerald"
          ? "bg-emerald-600 text-white"
          : "bg-violet-600 text-white";

  return (
    <aside className={`hidden w-64 flex-col border-r ${borderClass} px-5 py-6 backdrop-blur-sm md:flex`}>
      <div className="mb-8 flex items-center gap-2">
        <div className={`flex h-9 w-9 items-center justify-center rounded-2xl text-sm font-semibold ${logoClass}`}>
          {logoLetter}
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight text-zinc-900">{title}</p>
          <p className="text-xs text-zinc-500">{subtitle}</p>
        </div>
      </div>

      <nav className="space-y-1 text-sm">
        {sections.map((section, idx) => (
          <div key={idx} className={idx > 0 ? "mt-4 space-y-1" : "space-y-1"}>
            {section.title && (
              <p className="px-2 text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                {section.title}
              </p>
            )}
            {section.items.map((item) => (
              <SidebarNavLink
                key={item.href}
                href={item.href}
                label={item.label}
                isActive={item.active ?? (currentPath === item.href || currentPath.startsWith(item.href + "/"))}
                accent={accent}
              />
            ))}
          </div>
        ))}
      </nav>

      <div className="mt-auto space-y-3 pt-6 text-xs">
        {footer}
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
