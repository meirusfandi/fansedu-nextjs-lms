"use client";

import { FlashNoticeBar, useFlashNotice } from "@/components/FlashNotice";
import { Pagination, PAGE_SIZE } from "@/components/Pagination";
import {
  adminCreateUser,
  adminGetUser,
  adminListLevels,
  adminListUsers,
  adminListSekolah,
  adminListSubjects,
  adminUpdateUser,
} from "@/lib/api";
import type { Level, Sekolah, Subject, User, UserRole } from "@/lib/api-types";
import { normalizeUserRoleFromApi } from "@/lib/user-role";
import { useCallback, useEffect, useMemo, useState } from "react";

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  student: "Siswa",
  trainer: "Pengajar",
};

export default function AdminUsersPage() {
  const { notice, showSuccess, clearNotice } = useFlashNotice();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "detail" | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "trainer" as UserRole,
    subjectId: "",
    schoolId: "",
  });
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [schools, setSchools] = useState<Sekolah[]>([]);
  const [filterLevelId, setFilterLevelId] = useState("");
  const [filterSubjectId, setFilterSubjectId] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [page, setPage] = useState(1);

  const filteredUsers = useMemo(() => {
    const subjectLevelById = new Map<string, string>();
    for (const s of subjects) {
      if (s.levelId) subjectLevelById.set(s.id, s.levelId);
    }
    return users.filter((u) => {
      if (filterSubjectId && u.subjectId !== filterSubjectId) return false;
      if (filterLevelId) {
        const sid = u.subjectId ?? "";
        const lid = sid ? subjectLevelById.get(sid) ?? "" : "";
        if (lid !== filterLevelId) return false;
      }
      return true;
    });
  }, [users, subjects, filterLevelId, filterSubjectId]);

  const paginatedUsers = useMemo(
    () => filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredUsers, page]
  );

  /** Label sekolah / jenjang / bidang untuk tabel (API + lookup master data). */
  const userSchoolJenjangBidang = useMemo(() => {
    const levelById = new Map(levels.map((l) => [l.id, l.name]));
    const subjectById = new Map(subjects.map((s) => [s.id, s]));
    const schoolById = new Map(schools.map((s) => [s.id, s.namaSekolah]));

    return (u: User) => {
      const school =
        (u.school?.namaSekolah?.trim() && u.school.namaSekolah) ||
        (u.schoolName?.trim() && u.schoolName) ||
        (u.schoolId ? schoolById.get(u.schoolId) : undefined) ||
        "–";

      const bidang =
        (u.subject?.name?.trim() && u.subject.name) ||
        (u.subjectName?.trim() && u.subjectName) ||
        (u.subjectId ? subjectById.get(u.subjectId)?.name : undefined) ||
        "–";

      let jenjang = "–";
      if (u.level?.name?.trim()) jenjang = u.level.name;
      else if (u.levelName?.trim()) jenjang = u.levelName;
      else if (u.levelId && levelById.has(u.levelId)) jenjang = levelById.get(u.levelId) ?? "–";
      else if (u.subjectId) {
        const sub = subjectById.get(u.subjectId);
        const lid = sub?.levelId;
        if (lid && levelById.has(lid)) jenjang = levelById.get(lid) ?? "–";
      }

      return { school, jenjang, bidang };
    };
  }, [levels, subjects, schools]);

  useEffect(() => {
    if (filteredUsers.length > 0 && (page - 1) * PAGE_SIZE >= filteredUsers.length) {
      setPage(1);
    }
  }, [filteredUsers.length, page]);

  const loadUsers = useCallback(() => {
    setLoading(true);
    setError(null);
    adminListUsers()
      .then(setUsers)
      .catch((e) => {
        setError((e as Error).message ?? "Gagal memuat daftar user");
        setUsers([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const loadOptions = useCallback(() => {
    adminListSubjects().then(setSubjects).catch(() => setSubjects([]));
    adminListLevels().then(setLevels).catch(() => setLevels([]));
    adminListSekolah().then(setSchools).catch(() => setSchools([]));
  }, []);
  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  const openAdd = () => {
    setForm({
      name: "",
      email: "",
      password: "",
      role: "trainer",
      subjectId: "",
      schoolId: "",
    });
    setSelectedUser(null);
    setSubmitError(null);
    setModalMode("add");
  };

  const openDetail = async (u: User) => {
    setSelectedUser(u);
    setModalMode("detail");
    setDetailLoading(true);
    setSubmitError(null);
    try {
      const full = await adminGetUser(u.id);
      setSelectedUser(full);
    } catch (err) {
      setSubmitError((err as Error).message ?? "Gagal memuat detail user");
    } finally {
      setDetailLoading(false);
    }
  };

  const openEdit = async (u: User) => {
    setSelectedUser(u);
    setModalMode("edit");
    setSubmitError(null);
    setDetailLoading(true);
    try {
      const full = await adminGetUser(u.id);
      setForm({
        name: full.name,
        email: full.email,
        password: "",
        role: normalizeUserRoleFromApi(full.role),
        subjectId: full.subjectId ?? "",
        schoolId: full.schoolId ?? "",
      });
      setSelectedUser(full);
    } catch (err) {
      setSubmitError((err as Error).message ?? "Gagal memuat data user");
      setForm({
        name: u.name,
        email: u.email,
        password: "",
        role: normalizeUserRoleFromApi(u.role),
        subjectId: u.subjectId ?? "",
        schoolId: u.schoolId ?? "",
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedUser(null);
    setSubmitError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitLoading(true);
    const mode = modalMode;
    try {
      if (modalMode === "add") {
        await adminCreateUser({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          // Backend create saat ini hanya menerima student/trainer.
          // Jika admin dipilih di UI, fallback ke trainer agar request tetap valid.
          role: form.role === "admin" ? "trainer" : form.role,
          subjectId: form.subjectId.trim() || null,
          schoolId: form.schoolId.trim() || null,
        });
      } else if (modalMode === "edit" && selectedUser) {
        const body: {
          name?: string;
          email?: string;
          password?: string;
          role?: "student" | "trainer" | "admin";
          subjectId?: string | null;
          schoolId?: string | null;
        } = {
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
          subjectId: form.subjectId.trim() || null,
          schoolId: form.schoolId.trim() || null,
        };
        if (form.password.trim()) body.password = form.password;
        await adminUpdateUser(selectedUser.id, body);
      }
      closeModal();
      loadUsers();
      showSuccess(
        mode === "add" ? "Pengguna berhasil ditambahkan." : "Data pengguna berhasil diperbarui."
      );
    } catch (err) {
      setSubmitError((err as Error).message ?? "Gagal menyimpan");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="px-4 py-5 sm:px-6 md:px-8 md:py-8">
        <div className="mb-6 flex items-center justify-between md:mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Manage
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
              Management User
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              Admin dapat melihat, menambah, dan mengedit akun yang ada (role, subject, sekolah) sesuai dukungan backend.
            </p>
          </div>
          <button
            type="button"
            onClick={openAdd}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 shadow-sm hover:bg-zinc-800"
          >
            + Tambah User
          </button>
        </div>

        {notice && (
          <div className="mb-4">
            <FlashNoticeBar kind={notice.kind} message={notice.text} onDismiss={clearNotice} />
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mb-4 grid grid-cols-1 gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-zinc-600">Filter jenjang pendidikan</label>
            <select
              value={filterLevelId}
              onChange={(e) => {
                setFilterLevelId(e.target.value);
                setFilterSubjectId("");
              }}
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
            >
              <option value="">Semua jenjang</option>
              {levels.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">Filter bidang / subject</label>
            <select
              value={filterSubjectId}
              onChange={(e) => setFilterSubjectId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
            >
              <option value="">Semua bidang</option>
              {subjects
                .filter((s) => {
                  if (!filterLevelId) return true;
                  return (s.levelId ?? "") === filterLevelId;
                })
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-sm text-zinc-500">
              Memuat daftar user...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-sm text-zinc-500">
              <p>Belum ada user ditampilkan.</p>
              <p className="mt-2 text-xs">
                Jika seharusnya ada data, periksa koneksi dan hak akses. Klik &quot;Tambah User&quot; untuk menambah akun baru.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-200 text-sm">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-zinc-500">
                      Nama
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-500">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-500">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-500">
                      Sekolah
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-500">
                      Jenjang
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-500">
                      Kelas
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-500">
                      Bidang
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-zinc-500">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {paginatedUsers.map((u) => {
                    const { school, jenjang, bidang } = userSchoolJenjangBidang(u);
                    return (
                    <tr
                      key={u.id}
                      className="hover:bg-zinc-50"
                    >
                      <td className="px-4 py-3 font-medium text-zinc-900">
                        {u.name}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        {u.email}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
                          {ROLE_LABEL[u.role] ?? u.role}
                        </span>
                      </td>
                      <td className="max-w-[14rem] px-4 py-3 text-zinc-700">
                        <span className="line-clamp-2" title={school}>
                          {school}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-700">{jenjang}</td>
                      <td className="max-w-[10rem] px-4 py-3 text-zinc-700">
                        <span className="line-clamp-2" title={u.classLevel ?? ""}>
                          {u.classLevel?.trim() ? u.classLevel : "–"}
                        </span>
                      </td>
                      <td className="max-w-[12rem] px-4 py-3 text-zinc-700">
                        <span className="line-clamp-2" title={bidang}>
                          {bidang}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openDetail(u)}
                            className="rounded-lg border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                          >
                            Detail
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(u)}
                            className="rounded-lg bg-zinc-900 px-2 py-1 text-xs font-medium text-zinc-50 hover:bg-zinc-800"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {!loading && filteredUsers.length > 0 && (
            <Pagination
              currentPage={page}
              totalItems={filteredUsers.length}
              onPageChange={setPage}
              label="user"
            />
          )}
        </div>

      {/* Modal: Detail / Add / Edit */}
      {modalMode && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-4">
          <div
            className={`w-full rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl ${
              modalMode === "detail" ? "max-w-lg" : "max-w-md"
            }`}
          >
            {modalMode === "detail" ? (
              <>
                <h2 className="text-lg font-semibold text-zinc-900">
                  Detail User
                </h2>
                {submitError && (
                  <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {submitError}
                  </div>
                )}
                {detailLoading ? (
                  <p className="mt-4 text-sm text-zinc-500">Memuat...</p>
                ) : selectedUser ? (
                  <div className="mt-4 space-y-3 text-sm">
                    <div>
                      <p className="text-xs font-medium text-zinc-500">ID</p>
                      <p className="font-mono text-zinc-900">{selectedUser.id}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-zinc-500">Nama</p>
                      <p className="text-zinc-900">{selectedUser.name}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-zinc-500">Email</p>
                      <p className="text-zinc-900">{selectedUser.email}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-zinc-500">Role</p>
                      <p className="text-zinc-900">
                        {ROLE_LABEL[selectedUser.role] ?? selectedUser.role}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-zinc-500">Sekolah</p>
                      <p className="text-zinc-900">
                        {userSchoolJenjangBidang(selectedUser).school}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-zinc-500">Jenjang pendidikan</p>
                      <p className="text-zinc-900">
                        {userSchoolJenjangBidang(selectedUser).jenjang}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-zinc-500">Bidang / Subject</p>
                      <p className="text-zinc-900">
                        {userSchoolJenjangBidang(selectedUser).bidang}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-zinc-500">Kelas (classLevel)</p>
                      <p className="text-zinc-900">
                        {selectedUser.classLevel?.trim() ? selectedUser.classLevel : "–"}
                      </p>
                    </div>
                    {selectedUser.level && (
                      <div>
                        <p className="text-xs font-medium text-zinc-500">Jenjang — objek API</p>
                        <p className="mt-0.5 text-zinc-800">
                          <span className="font-medium">{selectedUser.level.name}</span>
                          <span className="ml-1 font-mono text-[11px] text-zinc-500">
                            ({selectedUser.level.id}
                            {selectedUser.level.slug ? ` · ${selectedUser.level.slug}` : ""})
                          </span>
                        </p>
                      </div>
                    )}
                    {selectedUser.subject && (
                      <div>
                        <p className="text-xs font-medium text-zinc-500">Bidang — objek API</p>
                        <p className="mt-0.5 text-zinc-800">
                          <span className="font-medium">{selectedUser.subject.name}</span>
                          <span className="ml-1 font-mono text-[11px] text-zinc-500">
                            ({selectedUser.subject.id}
                            {selectedUser.subject.levelId
                              ? ` · levelId ${selectedUser.subject.levelId}`
                              : ""}
                            )
                          </span>
                        </p>
                      </div>
                    )}
                    {selectedUser.school && (
                      <div>
                        <p className="text-xs font-medium text-zinc-500">Sekolah — objek API</p>
                        <p className="mt-0.5 text-zinc-800">
                          <span className="font-medium">{selectedUser.school.namaSekolah}</span>
                          <span className="ml-1 font-mono text-[11px] text-zinc-500">
                            ({selectedUser.school.id})
                          </span>
                        </p>
                      </div>
                    )}
                    {selectedUser.avatarUrl && (
                      <div>
                        <p className="text-xs font-medium text-zinc-500">Avatar</p>
                        <p className="break-all text-zinc-600">{selectedUser.avatarUrl}</p>
                      </div>
                    )}
                  </div>
                ) : null}
                <div className="mt-6 flex justify-end gap-2">
                  {selectedUser && (
                    <button
                      type="button"
                      onClick={() => openEdit(selectedUser)}
                      className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 hover:bg-zinc-800"
                    >
                      Edit
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                  >
                    Tutup
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-zinc-900">
                  {modalMode === "add" ? "Tambah User" : "Edit akun Admin"}
                </h2>
                {submitError && (
                  <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {submitError}
                  </div>
                )}
                {detailLoading ? (
                  <p className="mt-4 text-sm text-zinc-500">Memuat data...</p>
                ) : (
                  <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-600">
                        Nama *
                      </label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-600">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-600">
                        Password {modalMode === "edit" ? "(kosongkan jika tidak diubah)" : "*"}
                      </label>
                      <input
                        type="password"
                        required={modalMode === "add"}
                        minLength={modalMode === "add" ? 6 : undefined}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        placeholder={modalMode === "edit" ? "••••••••" : undefined}
                        className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-600">Role</label>
                      <select
                        value={form.role}
                        onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                        className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
                      >
                        <option value="student">Siswa</option>
                        <option value="trainer">Trainer</option>
                        <option value="admin">Admin</option>
                      </select>
                      {modalMode === "add" && (
                        <p className="mt-1 text-xs text-zinc-500">
                          Catatan: pembuatan akun saat ini mendukung role <strong>student</strong> atau{" "}
                          <strong>trainer</strong>. Jika pilih Admin, akan dibuat sebagai Trainer.
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-600">Bidang / Subject</label>
                      <select
                        value={form.subjectId}
                        onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
                      >
                        <option value="">— Pilih subject (opsional)</option>
                        {subjects.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-600">Sekolah</label>
                      <select
                        value={form.schoolId}
                        onChange={(e) => setForm({ ...form, schoolId: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
                      >
                        <option value="">— Pilih sekolah (opsional)</option>
                        {schools.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.namaSekolah}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={submitLoading}
                        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 hover:bg-zinc-800 disabled:opacity-50"
                      >
                        {submitLoading ? "Menyimpan..." : "Simpan"}
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
