/**
 * Preferensi notifikasi guru — default & gabungan dari GET /trainer/profile.
 * Penyimpanan hanya lewat API (PUT /trainer/profile).
 */

import type { TrainerProfileResponse } from "./api-types";

export interface GuruNotificationPreferences {
  /** Email saat pembayaran slot dikonfirmasi */
  emailPembayaran: boolean;
  /** Email pengingat rutin untuk aktivitas dan tenggat */
  emailPengingat: boolean;
  /** Email saat siswa menyelesaikan tryout atau ada progress */
  notifAktivitasSiswa: boolean;
}

export const DEFAULT_GURU_NOTIFICATION_PREFERENCES: GuruNotificationPreferences = {
  emailPembayaran: true,
  emailPengingat: true,
  notifAktivitasSiswa: false,
};

/** Bangun state UI dari respons profil trainer (field opsional → default). */
export function notificationPrefsFromProfile(
  p: TrainerProfileResponse | null | undefined
): GuruNotificationPreferences {
  const d = DEFAULT_GURU_NOTIFICATION_PREFERENCES;
  return {
    emailPembayaran: p?.emailPembayaran ?? d.emailPembayaran,
    emailPengingat: p?.emailPengingat ?? d.emailPengingat,
    notifAktivitasSiswa: p?.notifAktivitasSiswa ?? d.notifAktivitasSiswa,
  };
}
