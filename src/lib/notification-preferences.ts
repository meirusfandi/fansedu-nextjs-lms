/**
 * Preferensi notifikasi guru. Disimpan di localStorage per perangkat.
 * Bisa disinkronkan ke backend nanti (GET/PUT /trainer/notification-preferences).
 */

const STORAGE_KEY_PREFIX = "guru_notif_";

export interface GuruNotificationPreferences {
  /** Email saat pembayaran slot dikonfirmasi */
  emailPembayaran: boolean;
  /** Email pengingat rutin untuk aktivitas dan tenggat */
  emailPengingat: boolean;
  /** Email saat siswa menyelesaikan tryout atau ada progress */
  notifAktivitasSiswa: boolean;
}

const DEFAULT_PREFERENCES: GuruNotificationPreferences = {
  emailPembayaran: true,
  emailPengingat: true,
  notifAktivitasSiswa: false,
};

const KEYS = {
  emailPembayaran: `${STORAGE_KEY_PREFIX}pembayaran`,
  emailPengingat: `${STORAGE_KEY_PREFIX}pengingat`,
  notifAktivitasSiswa: `${STORAGE_KEY_PREFIX}aktivitas`,
} as const;

function readBool(key: string, defaultValue: boolean): boolean {
  if (typeof window === "undefined") return defaultValue;
  const v = localStorage.getItem(key);
  if (v === null) return defaultValue;
  return v === "true";
}

function writeBool(key: string, value: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, String(value));
}

/** Ambil preferensi notifikasi guru (dari localStorage). */
export function getGuruNotificationPreferences(): GuruNotificationPreferences {
  return {
    emailPembayaran: readBool(KEYS.emailPembayaran, DEFAULT_PREFERENCES.emailPembayaran),
    emailPengingat: readBool(KEYS.emailPengingat, DEFAULT_PREFERENCES.emailPengingat),
    notifAktivitasSiswa: readBool(KEYS.notifAktivitasSiswa, DEFAULT_PREFERENCES.notifAktivitasSiswa),
  };
}

/** Simpan satu atau semua preferensi notifikasi guru. */
export function setGuruNotificationPreferences(
  update: Partial<GuruNotificationPreferences>
): void {
  if (typeof window === "undefined") return;
  if (typeof update.emailPembayaran === "boolean") {
    writeBool(KEYS.emailPembayaran, update.emailPembayaran);
  }
  if (typeof update.emailPengingat === "boolean") {
    writeBool(KEYS.emailPengingat, update.emailPengingat);
  }
  if (typeof update.notifAktivitasSiswa === "boolean") {
    writeBool(KEYS.notifAktivitasSiswa, update.notifAktivitasSiswa);
  }
}

/** Reset ke nilai default. */
export function resetGuruNotificationPreferences(): void {
  setGuruNotificationPreferences(DEFAULT_PREFERENCES);
}

/** Cek apakah guru ingin dapat email saat pembayaran dikonfirmasi. */
export function guruWantsEmailPembayaran(): boolean {
  return getGuruNotificationPreferences().emailPembayaran;
}

/** Cek apakah guru ingin dapat email pengingat. */
export function guruWantsEmailPengingat(): boolean {
  return getGuruNotificationPreferences().emailPengingat;
}

/** Cek apakah guru ingin notifikasi aktivitas siswa. */
export function guruWantsNotifAktivitasSiswa(): boolean {
  return getGuruNotificationPreferences().notifAktivitasSiswa;
}
