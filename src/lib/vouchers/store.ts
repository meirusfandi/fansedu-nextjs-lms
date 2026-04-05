import fs from "fs";
import path from "path";
import { normalizeVouchers } from "./normalize";
import type { Voucher } from "./types";

export const VOUCHERS_FILE = path.join(process.cwd(), "data", "vouchers.json");

export function readVouchersFromDisk(): Voucher[] {
  try {
    const raw = fs.readFileSync(VOUCHERS_FILE, "utf-8");
    const parsed = JSON.parse(raw) as unknown;
    return normalizeVouchers(parsed);
  } catch {
    return [];
  }
}

export function writeVouchersToDisk(list: Voucher[]): void {
  fs.mkdirSync(path.dirname(VOUCHERS_FILE), { recursive: true });
  fs.writeFileSync(VOUCHERS_FILE, JSON.stringify(list, null, 2), "utf-8");
}
