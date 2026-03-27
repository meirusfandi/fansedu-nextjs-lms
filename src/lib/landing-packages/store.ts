import fs from "fs";
import path from "path";
import { DEFAULT_LANDING_PACKAGES } from "./defaultPackages";
import { normalizeLandingPackages } from "./normalize";
import type { LandingPackage } from "./types";

export const LANDING_PACKAGES_FILE = path.join(process.cwd(), "data", "landing-packages.json");

export function readLandingPackagesFromDisk(): LandingPackage[] {
  try {
    const raw = fs.readFileSync(LANDING_PACKAGES_FILE, "utf-8");
    const parsed = JSON.parse(raw) as unknown;
    return normalizeLandingPackages(parsed);
  } catch {
    return [...DEFAULT_LANDING_PACKAGES];
  }
}

export function writeLandingPackagesToDisk(packages: LandingPackage[]): void {
  fs.mkdirSync(path.dirname(LANDING_PACKAGES_FILE), { recursive: true });
  fs.writeFileSync(LANDING_PACKAGES_FILE, JSON.stringify(packages, null, 2), "utf-8");
}

export function filterActiveSorted(packages: LandingPackage[]): LandingPackage[] {
  return [...packages]
    .filter((p) => p.active !== false)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}
