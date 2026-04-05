/** Voucher diskon — disimpan di `data/vouchers.json` (admin). */

export interface Voucher {
  id: string;
  /** Kode unik yang bisa diinput pengguna (mis. saat checkout). */
  code: string;
  /** Nama singkat / keterangan internal. */
  name: string;
  /** Nominal potongan dalam Rupiah (bilangan bulat). */
  nominal: number;
  /** Berlaku sampai tanggal ini (ISO date, akhir hari lokal). */
  expiresAt: string;
  /** Nonaktif = tidak dipakai meski belum kedaluwarsa. */
  active: boolean;
  /** ID kelas dari Management Kelas (`/admin/kelas`, localStorage). */
  applicableClassIds: string[];
  createdAt: string;
  updatedAt: string;
}
