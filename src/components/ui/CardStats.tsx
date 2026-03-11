"use client";

import type { ReactNode } from "react";

export interface CardStatsProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: { value: number; label: string };
  className?: string;
}

export function CardStats({ title, value, subtitle, icon, trend, className = "" }: CardStatsProps) {
  return (
    <div
      className={`rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">{value}</p>
          {subtitle && <p className="mt-0.5 text-sm text-zinc-600">{subtitle}</p>}
          {trend && (
            <p className="mt-1 text-xs text-zinc-500">
              <span className={trend.value >= 0 ? "text-emerald-600" : "text-red-600"}>
                {trend.value >= 0 ? "+" : ""}
                {trend.value}%
              </span>{" "}
              {trend.label}
            </p>
          )}
        </div>
        {icon && (
          <div className="rounded-lg bg-zinc-100 p-2 text-zinc-600">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
