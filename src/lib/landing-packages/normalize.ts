import type { LandingPackage } from "./types";

function randomId(i: number): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `pkg-${crypto.randomUUID()}`;
  }
  return `pkg-import-${i}-${Date.now()}`;
}

export function normalizeLandingPackages(input: unknown): LandingPackage[] {
  if (!Array.isArray(input)) return [];
  return input.map((row, i) => {
    const r = row as Record<string, unknown>;
    return {
      id: typeof r.id === "string" && r.id.trim() ? r.id.trim() : randomId(i),
      title: typeof r.title === "string" ? r.title : "",
      description: typeof r.description === "string" ? r.description : "",
      priceLabel: typeof r.priceLabel === "string" ? r.priceLabel : "",
      promoLabel:
        typeof r.promoLabel === "string" && r.promoLabel.trim() ? r.promoLabel.trim() : undefined,
      highlight:
        typeof r.highlight === "string" && r.highlight.trim() ? r.highlight.trim() : undefined,
      ctaLabel: typeof r.ctaLabel === "string" && r.ctaLabel.trim() ? r.ctaLabel.trim() : "Info",
      ctaHref:
        typeof r.ctaHref === "string" && r.ctaHref.trim() ? r.ctaHref.trim() : "/login",
      sortOrder: typeof r.sortOrder === "number" && !Number.isNaN(r.sortOrder) ? r.sortOrder : i,
      active: r.active !== false,
    };
  });
}
