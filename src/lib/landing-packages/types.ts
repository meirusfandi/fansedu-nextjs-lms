/** Paket promo untuk landing page (dikelola admin, disimpan di `data/landing-packages.json` atau default). */

export type LandingPackage = {
  id: string;
  title: string;
  description: string;
  /** Teks harga tampil, mis. "Rp 299.000" atau "Mulai Rp 99rb" */
  priceLabel: string;
  /** Label promo opsional, mis. "Diskon 15%" */
  promoLabel?: string;
  /** Badge kecil opsional, mis. "Terlaris" */
  highlight?: string;
  /** Teks tombol CTA */
  ctaLabel?: string;
  /** URL relatif (/) atau absolut (https://...) */
  ctaHref?: string;
  sortOrder: number;
  active: boolean;
};
