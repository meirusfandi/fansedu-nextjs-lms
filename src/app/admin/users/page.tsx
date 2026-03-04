"use client";

import { AdminSidebar } from "@/components/AdminSidebar";
import { Pagination, PAGE_SIZE } from "@/components/Pagination";
import {
  adminCreateUser,
  adminGetUser,
  adminListUsers,
  adminListSekolah,
  adminListSubjects,
  adminUpdateUser,
  logout,
  clearAuthToken,
} from "@/lib/api";
import type { Sekolah, Subject, User } from "@/lib/api-types";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  student: "Siswa",
  trainer: "Pengajar",
};

export default function AdminUsersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "detail" | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student" as "student" | "trainer",
    subject_id: "",
    school_id: "",
  });
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [schools, setSchools] = useState<Sekolah[]>([]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [page, setPage] = useState(1);

  const paginatedUsers = useMemo(
    () => users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [users, page]
  );
  useEffect(() => {
    if (users.length > 0 && (page - 1) * PAGE_SIZE >= users.length) {
      setPage(1);
    }
  }, [users.length, page]);

  const handleLogout = useCallback(() => {
    logout().catch(() => {});
    clearAuthToken();
    router.push("/login");
  }, [router]);

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
      role: "student",
      subject_id: "",
      school_id: "",
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
        role: (full.role === "admin" ? "student" : full.role) as "student" | "trainer",
        subject_id: full.subject_id ?? "",
        school_id: full.school_id ?? "",
      });
      setSelectedUser(full);
    } catch (err) {
      setSubmitError((err as Error).message ?? "Gagal memuat data user");
      setForm({
        name: u.name,
        email: u.email,
        password: "",
        role: (u.role === "admin" ? "student" : u.role) as "student" | "trainer",
        subject_id: u.subject_id ?? "",
        school_id: u.school_id ?? "",
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
    try {
      if (modalMode === "add") {
        await adminCreateUser({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
          subject_id: form.subject_id.trim() || undefined,
          school_id: form.school_id.trim() || undefined,
        });
      } else if (modalMode === "edit" && selectedUser) {
        const body: {
          name?: string;
          email?: string;
          password?: string;
          role?: "student" | "trainer";
          subject_id?: string | null;
          school_id?: string | null;
        } = {
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
          subject_id: form.subject_id.trim() || null,
          school_id: form.school_id.trim() || null,
        };
        if (form.password.trim()) body.password = form.password;
        await adminUpdateUser(selectedUser.id, body);
      }
      closeModal();
      loadUsers();
    } catch (err) {
      setSubmitError((err as Error).message ?? "Gagal menyimpan");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <AdminSidebar currentPath={pathname ?? ""} onLogout={handleLogout} />

      <main className="flex-1 px-4 py-5 sm:px-6 md:px-8 md:py-8">
        <div className="mb-6 flex items-center justify-between md:mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
              Manage
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
              Management User
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Lihat detail, tambah, dan edit data user (siswa & pengajar).
            </p>
          </div>
          <button
            type="button"
            onClick={openAdd}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 shadow-sm hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            + Tambah User
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          {loading ? (
            <div className="p-8 text-center text-sm text-zinc-500">
              Memuat daftar user...
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-sm text-zinc-500">
              <p>Belum ada user ditampilkan.</p>
              <p className="mt-2 text-xs">
                Pastikan backend <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">GET /api/v1/admin/users</code> mengembalikan semua user (termasuk admin). Klik &quot;Tambah User&quot; untuk menambah siswa atau pengajar.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
                <thead className="bg-zinc-50 dark:bg-zinc-900/50">
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
                    <th className="px-4 py-3 text-right font-medium text-zinc-500">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {paginatedUsers.map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30"
                    >
                      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                        {u.name}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {u.email}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                          {ROLE_LABEL[u.role] ?? u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openDetail(u)}
                            className="rounded-lg border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                          >
                            Detail
                          </button>
                          {u.role !== "admin" && (
                            <button
                              type="button"
                              onClick={() => openEdit(u)}
                              className="rounded-lg bg-zinc-900 px-2 py-1 text-xs font-medium text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!loading && users.length > 0 && (
            <Pagination
              currentPage={page}
              totalItems={users.length}
              onPageChange={setPage}
              label="user"
            />
          )}
        </div>
      </main>

      {/* Modal: Detail / Add / Edit */}
      {modalMode && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
            {modalMode === "detail" ? (
              <>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  Detail User
                </h2>
                {submitError && (
                  <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                    {submitError}
                  </div>
                )}
                {detailLoading ? (
                  <p className="mt-4 text-sm text-zinc-500">Memuat...</p>
                ) : selectedUser ? (
                  <div className="mt-4 space-y-3 text-sm">
                    <div>
                      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">ID</p>
                      <p className="font-mono text-zinc-900 dark:text-zinc-50">{selectedUser.id}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Nama</p>
                      <p className="text-zinc-900 dark:text-zinc-50">{selectedUser.name}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Email</p>
                      <p className="text-zinc-900 dark:text-zinc-50">{selectedUser.email}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Role</p>
                      <p className="text-zinc-900 dark:text-zinc-50">
                        {ROLE_LABEL[selectedUser.role] ?? selectedUser.role}
                      </p>
                    </div>
                    {(selectedUser.subject_id || selectedUser.subject_name) && (
                      <div>
                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Bidang / Subject</p>
                        <p className="text-zinc-900 dark:text-zinc-50">
                          {selectedUser.subject_name ?? subjects.find((s) => s.id === selectedUser.subject_id)?.name ?? selectedUser.subject_id}
                        </p>
                      </div>
                    )}
                    {(selectedUser.school_id || selectedUser.school_name) && (
                      <div>
                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Sekolah</p>
                        <p className="text-zinc-900 dark:text-zinc-50">
                          {selectedUser.school_name ?? schools.find((s) => s.id === selectedUser.school_id)?.nama_sekolah ?? selectedUser.school_id}
                        </p>
                      </div>
                    )}
                    {selectedUser.avatar_url && (
                      <div>
                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Avatar</p>
                        <p className="break-all text-zinc-600 dark:text-zinc-400">{selectedUser.avatar_url}</p>
                      </div>
                    )}
                  </div>
                ) : null}
                <div className="mt-6 flex justify-end gap-2">
                  {selectedUser && selectedUser.role !== "admin" && (
                    <button
                      type="button"
                      onClick={() => openEdit(selectedUser)}
                      className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                    >
                      Edit
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    Tutup
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  {modalMode === "add" ? "Tambah User" : "Edit User"}
                </h2>
                {submitError && (
                  <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                    {submitError}
                  </div>
                )}
                {detailLoading ? (
                  <p className="mt-4 text-sm text-zinc-500">Memuat data...</p>
                ) : (
                  <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Nama *
                      </label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Password {modalMode === "edit" ? "(kosongkan jika tidak diubah)" : "*"}
                      </label>
                      <input
                        type="password"
                        required={modalMode === "add"}
                        minLength={modalMode === "add" ? 6 : undefined}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        placeholder={modalMode === "edit" ? "••••••••" : undefined}
                        className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Role *
                      </label>
                      <select
                        value={form.role}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            role: e.target.value as "student" | "trainer",
                          })
                        }
                        className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                      >
                        <option value="student">Siswa</option>
                        <option value="trainer">Pengajar</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Bidang / Subject
                      </label>
                      <select
                        value={form.subject_id}
                        onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
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
                      <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Sekolah
                      </label>
                      <select
                        value={form.school_id}
                        onChange={(e) => setForm({ ...form, school_id: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                      >
                        <option value="">— Pilih sekolah (opsional)</option>
                        {schools.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nama_sekolah}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={submitLoading}
                        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
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
