/**
 * Normalisasi kunci objek JSON ke camelCase untuk kontrak API tunggal (request/response).
 * Dipakai di `lib/api` `request()` dan proxy Next `/api/v1/*` agar konsisten.
 */

export function toCamelCaseKey(key: string): string {
  return key
    .replace(/[_-\s]+([a-zA-Z0-9])/g, (_, c: string) => c.toUpperCase())
    .replace(/^([A-Z])/, (m) => m.toLowerCase());
}

export function deepToCamelCase<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((v) => deepToCamelCase(v)) as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    Object.entries(value as Record<string, unknown>).forEach(([k, v]) => {
      out[toCamelCaseKey(k)] = deepToCamelCase(v);
    });
    return out as T;
  }
  return value;
}
