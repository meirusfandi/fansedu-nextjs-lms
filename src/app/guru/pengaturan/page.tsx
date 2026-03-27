"use client";

import { Pagination, PAGE_SIZE } from "@/components/Pagination";
import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getAuthUserName, changePassword, getTrainerProfile, updateTrainerProfile, adminListSekolah, createTrainerSchool } from "@/lib/api";
import type { Sekolah } from "@/lib/api-types";
import {
  getGuruNotificationPreferences,
  setGuruNotificationPreferences,
  resetGuruNotificationPreferences,
  type GuruNotificationPreferences,
} from "@/lib/notification-preferences";

export default function GuruPengaturanPage() {
  const [profileName, setProfileName] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileFetched, setProfileFetched] = useState(false);
  const [schoolInfo, setSchoolInfo] = useState<{
    id?: string;
    nama_sekolah: string;
    alamat?: string | null;
    telepon?: string | null;
    npsn?: string | null;
    kabupaten_kota?: string | null;
  } | null>(null);
  const [schoolLinkLoading, setSchoolLinkLoading] = useState(false);
  const [schoolList, setSchoolList] = useState<Sekolah[]>([]);
  const [schoolListLoading, setSchoolListLoading] = useState(false);
  const [schoolSearchQuery, setSchoolSearchQuery] = useState("");
  const [showCreateSchool, setShowCreateSchool] = useState(false);
  const [createSchoolForm, setCreateSchoolForm] = useState({
    nama_sekolah: "",
    npsn: "",
    alamat: "",
    kabupaten_kota: "",
    telepon: "",
  });
  const [createSchoolLoading, setCreateSchoolLoading] = useState(false);
  const [schoolPage, setSchoolPage] = useState(1);

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    new_password_confirm: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [notifPrefs, setNotifPrefs] = useState<GuruNotificationPreferences>({
    emailPembayaran: true,
    emailPengingat: true,
    notifAktivitasSiswa: false,
  });
  const [notifSavedMessage, setNotifSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    setNotifPrefs(getGuruNotificationPreferences());
  }, []);

  useEffect(() => {
    getTrainerProfile()
      .then((p) => {
        if (p?.name) setProfileName(p.name);
        else setProfileName(getAuthUserName() ?? "");
        if (p?.school) {
          setSchoolInfo({
            id: p.school.id,
            nama_sekolah: p.school.nama_sekolah,
            alamat: p.school.alamat,
            telepon: p.school.telepon,
            npsn: p.school.npsn,
            kabupaten_kota: p.school.kabupaten_kota,
          });
        } else {
          setSchoolInfo(null);
        }
      })
      .catch(() => {
        setProfileName(getAuthUserName() ?? "");
        setSchoolInfo(null);
      })
      .finally(() => setProfileFetched(true));
  }, []);

  useEffect(() => {
    setSchoolListLoading(true);
    adminListSekolah()
      .then(setSchoolList)
      .catch(() => setSchoolList([]))
      .finally(() => setSchoolListLoading(false));
  }, []);

  useEffect(() => {
    if (!notifSavedMessage) return;
    const t = setTimeout(() => setNotifSavedMessage(null), 2000);
    return () => clearTimeout(t);
  }, [notifSavedMessage]);

  const updateNotif = (update: Partial<GuruNotificationPreferences>) => {
    setGuruNotificationPreferences(update);
    setNotifPrefs((p) => ({ ...p, ...update }));
    setNotifSavedMessage("Preferensi disimpan");
  };

  const handleResetNotif = () => {
    resetGuruNotificationPreferences();
    setNotifPrefs(getGuruNotificationPreferences());
    setNotifSavedMessage("Preferensi direset ke default");
  };

  const handleSubmitProfile = async (e: FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);
    const name = profileName.trim();
    if (!name) {
      setProfileError("Nama tidak boleh kosong.");
      return;
    }
    setProfileLoading(true);
    try {
      await updateTrainerProfile({ name });
      setProfileSuccess("Profil berhasil diperbarui.");
    } catch (err) {
      setProfileError((err as Error).message || "Gagal memperbarui profil. Pastikan backend menyediakan PUT /trainer/profile.");
    } finally {
      setProfileLoading(false);
    }
  };

  const refetchProfile = () => {
    getTrainerProfile()
      .then((p) => {
        if (p?.name) setProfileName(p.name);
        if (p?.school) {
          setSchoolInfo({
            id: p.school.id,
            nama_sekolah: p.school.nama_sekolah,
            alamat: p.school.alamat,
            telepon: p.school.telepon,
            npsn: p.school.npsn,
            kabupaten_kota: p.school.kabupaten_kota,
          });
        } else setSchoolInfo(null);
      })
      .catch(() => setSchoolInfo(null));
  };

  const handleSelectSchool = (school: Sekolah) => {
    setSchoolLinkLoading(true);
    setProfileError(null);
    setProfileSuccess(null);
    updateTrainerProfile({ school_id: school.id })
      .then(() => {
        setProfileSuccess("Sekolah berhasil dikaitkan.");
        setSchoolSearchQuery("");
        refetchProfile();
      })
      .catch((err) => setProfileError((err as Error).message || "Gagal mengaitkan sekolah."))
      .finally(() => setSchoolLinkLoading(false));
  };

  const handleCreateSchool = async (e: FormEvent) => {
    e.preventDefault();
    const nama = createSchoolForm.nama_sekolah.trim();
    if (!nama) {
      setProfileError("Nama sekolah wajib diisi.");
      return;
    }
    setCreateSchoolLoading(true);
    setProfileError(null);
    setProfileSuccess(null);
    try {
      const created = await createTrainerSchool({
        nama_sekolah: nama,
        npsn: createSchoolForm.npsn.trim() || undefined,
        alamat: createSchoolForm.alamat.trim() || undefined,
        kabupaten_kota: createSchoolForm.kabupaten_kota.trim() || undefined,
        telepon: createSchoolForm.telepon.trim() || undefined,
      });
      await updateTrainerProfile({ school_id: created.id });
      setProfileSuccess("Sekolah baru berhasil dibuat dan dikaitkan.");
      setShowCreateSchool(false);
      setCreateSchoolForm({ nama_sekolah: "", npsn: "", alamat: "", kabupaten_kota: "", telepon: "" });
      adminListSekolah().then(setSchoolList);
      refetchProfile();
    } catch (err) {
      setProfileError((err as Error).message || "Gagal membuat sekolah.");
    } finally {
      setCreateSchoolLoading(false);
    }
  };

  const filteredSchools = schoolSearchQuery.trim()
    ? schoolList.filter((s) =>
        s.nama_sekolah.toLowerCase().includes(schoolSearchQuery.toLowerCase())
      )
    : schoolList;

  const paginatedSchools = useMemo(
    () => filteredSchools.slice((schoolPage - 1) * PAGE_SIZE, schoolPage * PAGE_SIZE),
    [filteredSchools, schoolPage]
  );

  useEffect(() => {
    setSchoolPage(1);
  }, [schoolSearchQuery]);

  useEffect(() => {
    if (filteredSchools.length > 0 && (schoolPage - 1) * PAGE_SIZE >= filteredSchools.length) {
      setSchoolPage(1);
    }
  }, [filteredSchools.length, schoolPage]);

  const handleUnlinkSchool = async () => {
    setSchoolLinkLoading(true);
    setProfileError(null);
    setProfileSuccess(null);
    try {
      await updateTrainerProfile({ school_id: "" });
      setProfileSuccess("Sekolah berhasil dilepas.");
      setSchoolInfo(null);
      refetchProfile();
    } catch (err) {
      setProfileError((err as Error).message || "Gagal melepas sekolah.");
    } finally {
      setSchoolLinkLoading(false);
    }
  };

  const handleSubmitPassword = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);
    if (passwordForm.new_password !== passwordForm.new_password_confirm) {
      setPasswordError("Kata sandi baru dan konfirmasi tidak cocok.");
      return;
    }
    if (passwordForm.new_password.length < 6) {
      setPasswordError("Kata sandi baru minimal 6 karakter.");
      return;
    }
    setPasswordLoading(true);
    try {
      await changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      setPasswordSuccess("Kata sandi berhasil diubah.");
      setPasswordForm({ current_password: "", new_password: "", new_password_confirm: "" });
    } catch (err) {
      setPasswordError((err as Error).message || "Gagal mengubah kata sandi. Periksa kata sandi saat ini.");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <main className="flex flex-1 flex-col px-4 py-6 sm:px-6 md:px-8 md:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Pengaturan</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Kelola profil, kata sandi, dan preferensi notifikasi.
        </p>
      </div>

      <div className="max-w-xl space-y-6">
        {/* Profil */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-800">Profil</h2>
          <p className="mt-1 text-xs text-zinc-500">Perubahan nama/profile dapat ditambahkan saat backend mendukung (mis. PUT /trainer/profile).</p>
          {profileSuccess && (
            <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{profileSuccess}</div>
          )}
          {profileError && (
            <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{profileError}</div>
          )}
          <form onSubmit={handleSubmitProfile} className="mt-3 space-y-3">
            <div>
              <label htmlFor="profile_name" className="block text-xs font-medium text-zinc-600">Nama tampil</label>
              <input
                id="profile_name"
                type="text"
                value={profileFetched ? profileName : "…"}
                onChange={(e) => setProfileName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                placeholder="Nama Anda"
                disabled={!profileFetched}
              />
            </div>
            <button
              type="submit"
              disabled={profileLoading || !profileFetched}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
            >
              {profileLoading ? "Menyimpan..." : "Simpan perubahan"}
            </button>
          </form>
        </section>

        {/* Detail info sekolah */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-800">Detail info sekolah</h2>
          <p className="mt-1 text-xs text-zinc-500">Data sekolah yang terhubung dengan akun guru (dari GET /trainer/profile).</p>
          {schoolInfo ? (
            <>
              <dl className="mt-4 space-y-2 text-sm">
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Nama sekolah</dt>
                  <dd className="mt-0.5 font-medium text-zinc-900">{schoolInfo.nama_sekolah || "—"}</dd>
                </div>
                {schoolInfo.npsn != null && schoolInfo.npsn !== "" && (
                  <div>
                    <dt className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">NPSN</dt>
                    <dd className="mt-0.5 text-zinc-700">{schoolInfo.npsn}</dd>
                  </div>
                )}
                {schoolInfo.kabupaten_kota != null && schoolInfo.kabupaten_kota !== "" && (
                  <div>
                    <dt className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Kabupaten/Kota</dt>
                    <dd className="mt-0.5 text-zinc-700">{schoolInfo.kabupaten_kota}</dd>
                  </div>
                )}
                {schoolInfo.alamat != null && schoolInfo.alamat !== "" && (
                  <div>
                    <dt className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Alamat</dt>
                    <dd className="mt-0.5 text-zinc-700">{schoolInfo.alamat}</dd>
                  </div>
                )}
                {schoolInfo.telepon != null && schoolInfo.telepon !== "" && (
                  <div>
                    <dt className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Telepon</dt>
                    <dd className="mt-0.5 text-zinc-700">{schoolInfo.telepon}</dd>
                  </div>
                )}
              </dl>
              <button
                type="button"
                onClick={handleUnlinkSchool}
                disabled={schoolLinkLoading}
                className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50"
              >
                {schoolLinkLoading ? "Memproses..." : "Lepas sekolah"}
              </button>
            </>
          ) : (
            <p className="mt-3 rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 px-3 py-4 text-center text-xs text-zinc-500">
              Info sekolah akan tampil setelah backend mengembalikan data dari GET /trainer/profile (termasuk objek school).
            </p>
          )}
          <div className="mt-4 border-t border-zinc-100 pt-4">
            <p className="text-xs font-medium text-zinc-600">Cari dan pilih sekolah dari daftar terdaftar (Master Data)</p>
            <input
              type="text"
              value={schoolSearchQuery}
              onChange={(e) => setSchoolSearchQuery(e.target.value)}
              placeholder="Ketik nama sekolah..."
              className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            />
            {schoolListLoading ? (
              <p className="mt-2 text-xs text-zinc-500">Memuat daftar sekolah...</p>
            ) : paginatedSchools.length > 0 ? (
              <div className="mt-2 overflow-hidden rounded-lg border border-zinc-200 bg-white">
                <ul className="max-h-60 overflow-y-auto">
                  {paginatedSchools.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => handleSelectSchool(s)}
                        disabled={schoolLinkLoading}
                        className="w-full px-3 py-2.5 text-left text-sm hover:bg-zinc-50 disabled:opacity-50"
                      >
                        <span className="font-medium text-zinc-900">{s.nama_sekolah}</span>
                        {s.kabupaten_kota && (
                          <span className="ml-2 text-zinc-500">— {s.kabupaten_kota}</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
                {filteredSchools.length > 0 && (
                  <Pagination
                    currentPage={schoolPage}
                    totalItems={filteredSchools.length}
                    onPageChange={setSchoolPage}
                    label="sekolah"
                  />
                )}
              </div>
            ) : (
              <p className="mt-2 text-xs text-zinc-500">
                {schoolSearchQuery.trim() ? "Tidak ada sekolah yang cocok." : "Daftar sekolah kosong atau belum dimuat."}
              </p>
            )}

            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowCreateSchool((v) => !v)}
                className="text-sm font-medium text-sky-600 hover:underline"
              >
                {showCreateSchool ? "Batal buat baru" : "+ Buat sekolah baru"}
              </button>
              {showCreateSchool && (
                <form onSubmit={handleCreateSchool} className="mt-3 space-y-2 rounded-lg border border-zinc-200 bg-zinc-50/50 p-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-600">Nama sekolah *</label>
                    <input
                      type="text"
                      required
                      value={createSchoolForm.nama_sekolah}
                      onChange={(e) => setCreateSchoolForm((f) => ({ ...f, nama_sekolah: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                      placeholder="Contoh: SMA Negeri 1 Jakarta"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-600">NPSN</label>
                    <input
                      type="text"
                      value={createSchoolForm.npsn}
                      onChange={(e) => setCreateSchoolForm((f) => ({ ...f, npsn: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                      placeholder="Opsional"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-600">Kabupaten/Kota</label>
                    <input
                      type="text"
                      value={createSchoolForm.kabupaten_kota}
                      onChange={(e) => setCreateSchoolForm((f) => ({ ...f, kabupaten_kota: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                      placeholder="Opsional"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-600">Alamat</label>
                    <input
                      type="text"
                      value={createSchoolForm.alamat}
                      onChange={(e) => setCreateSchoolForm((f) => ({ ...f, alamat: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                      placeholder="Opsional"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-600">Telepon</label>
                    <input
                      type="text"
                      value={createSchoolForm.telepon}
                      onChange={(e) => setCreateSchoolForm((f) => ({ ...f, telepon: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                      placeholder="Opsional"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={createSchoolLoading}
                    className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
                  >
                    {createSchoolLoading ? "Membuat..." : "Buat sekolah dan kaitkan"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* Ubah kata sandi */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-800">Ubah kata sandi</h2>
          <p className="mt-1 text-xs text-zinc-500">Ganti kata sandi akun Anda. Pastikan backend menyediakan POST /auth/change-password.</p>
          {passwordSuccess && (
            <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {passwordSuccess}
            </div>
          )}
          {passwordError && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {passwordError}
            </div>
          )}
          <form onSubmit={handleSubmitPassword} className="mt-4 space-y-3">
            <div>
              <label htmlFor="current_password" className="block text-xs font-medium text-zinc-600">Kata sandi saat ini</label>
              <input
                id="current_password"
                type="password"
                required
                autoComplete="current-password"
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm((f) => ({ ...f, current_password: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label htmlFor="new_password" className="block text-xs font-medium text-zinc-600">Kata sandi baru</label>
              <input
                id="new_password"
                type="password"
                required
                autoComplete="new-password"
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm((f) => ({ ...f, new_password: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                placeholder="Min. 6 karakter"
              />
            </div>
            <div>
              <label htmlFor="new_password_confirm" className="block text-xs font-medium text-zinc-600">Konfirmasi kata sandi baru</label>
              <input
                id="new_password_confirm"
                type="password"
                required
                autoComplete="new-password"
                value={passwordForm.new_password_confirm}
                onChange={(e) => setPasswordForm((f) => ({ ...f, new_password_confirm: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                placeholder="Ulangi kata sandi baru"
              />
            </div>
            <button
              type="submit"
              disabled={passwordLoading}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
            >
              {passwordLoading ? "Mengubah..." : "Ubah kata sandi"}
            </button>
          </form>
        </section>

        {/* Notifikasi */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-800">Notifikasi</h2>
          <p className="mt-1 text-xs text-zinc-500">Atur preferensi notifikasi. Pengaturan disimpan di perangkat ini.</p>
          {notifSavedMessage && (
            <p className="mt-2 text-xs font-medium text-emerald-600" role="status">{notifSavedMessage}</p>
          )}
          <ul className="mt-4 space-y-3">
            <li className="flex items-center justify-between gap-4 rounded-lg border border-zinc-100 bg-zinc-50/50 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-800">Email saat ada pembayaran</p>
                <p className="text-[11px] text-zinc-500">Dapatkan email ketika pembayaran slot dikonfirmasi</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={notifPrefs.emailPembayaran}
                onClick={() => updateNotif({ emailPembayaran: !notifPrefs.emailPembayaran })}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 ${
                  notifPrefs.emailPembayaran ? "bg-sky-600" : "bg-zinc-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                    notifPrefs.emailPembayaran ? "translate-x-5" : "translate-x-1"
                  }`}
                  aria-hidden
                />
              </button>
            </li>
            <li className="flex items-center justify-between gap-4 rounded-lg border border-zinc-100 bg-zinc-50/50 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-800">Email pengingat</p>
                <p className="text-[11px] text-zinc-500">Pengingat rutin untuk aktivitas dan tenggat</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={notifPrefs.emailPengingat}
                onClick={() => updateNotif({ emailPengingat: !notifPrefs.emailPengingat })}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 ${
                  notifPrefs.emailPengingat ? "bg-sky-600" : "bg-zinc-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                    notifPrefs.emailPengingat ? "translate-x-5" : "translate-x-1"
                  }`}
                  aria-hidden
                />
              </button>
            </li>
            <li className="flex items-center justify-between gap-4 rounded-lg border border-zinc-100 bg-zinc-50/50 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-800">Notifikasi aktivitas siswa</p>
                <p className="text-[11px] text-zinc-500">Email saat siswa menyelesaikan tryout atau ada progress</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={notifPrefs.notifAktivitasSiswa}
                onClick={() => updateNotif({ notifAktivitasSiswa: !notifPrefs.notifAktivitasSiswa })}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 ${
                  notifPrefs.notifAktivitasSiswa ? "bg-sky-600" : "bg-zinc-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                    notifPrefs.notifAktivitasSiswa ? "translate-x-5" : "translate-x-1"
                  }`}
                  aria-hidden
                />
              </button>
            </li>
          </ul>
          <button
            type="button"
            onClick={handleResetNotif}
            className="mt-3 text-xs font-medium text-zinc-500 hover:text-zinc-700 underline-offset-2 hover:underline"
          >
            Reset ke default
          </button>
        </section>

        <p className="text-center">
          <Link href="/guru" className="text-sm font-medium text-sky-600 hover:underline">
            Kembali ke Dashboard
          </Link>
        </p>
      </div>
    </main>
  );
}
