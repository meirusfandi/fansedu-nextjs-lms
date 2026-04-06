"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FlashNoticeBar, useFlashNotice } from "@/components/FlashNotice";
import {
  adminCreateSetting,
  adminDeleteSetting,
  adminGetSetting,
  adminListSettings,
  adminListSettingsEnvKeys,
  adminUpdateSetting,
  getFriendlyApiErrorMessage,
} from "@/lib/api";
import type { AdminCreateSettingRequest, AdminSetting, AdminUpdateSettingRequest } from "@/lib/api-types";

function slugifyKey(key: string): string {
  return key
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

type FormState = {
  key: string;
  slug: string;
  value: string;
  description: string;
};

function emptyForm(): FormState {
  return { key: "", slug: "", value: "", description: "" };
}

export default function MasterDataSettingPage() {
  const { notice, showSuccess, showError, clearNotice } = useFlashNotice();
  const [envKeys, setEnvKeys] = useState<string[]>([]);
  const [list, setList] = useState<AdminSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalMode, setModalMode] = useState<"add" | "edit" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(() => emptyForm());
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [settings, keys] = await Promise.all([adminListSettings(), adminListSettingsEnvKeys()]);
      setList(settings.sort((a, b) => a.key.localeCompare(b.key)));
      setEnvKeys(keys);
    } catch (e) {
      setError(getFriendlyApiErrorMessage(e));
      setList([]);
      setEnvKeys([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const openAdd = () => {
    setForm(emptyForm());
    setEditingId(null);
    setModalMode("add");
    setSubmitError(null);
  };

  const openEdit = async (row: AdminSetting) => {
    setSubmitError(null);
    setModalMode("edit");
    setEditingId(row.id);
    try {
      const full = await adminGetSetting(row.id);
      const s = full ?? row;
      setForm({
        key: s.key,
        slug: s.slug ?? slugifyKey(s.key),
        value: s.value,
        description: s.description ?? "",
      });
    } catch {
      setForm({
        key: row.key,
        slug: row.slug ?? slugifyKey(row.key),
        value: row.value,
        description: row.description ?? "",
      });
    }
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingId(null);
    setSubmitError(null);
    setForm(emptyForm());
  };

  const handleCreate = async () => {
    const key = form.key.trim();
    if (!key) {
      setSubmitError("Key wajib diisi.");
      return;
    }
    const body: AdminCreateSettingRequest = {
      key,
      slug: form.slug.trim() || slugifyKey(key) || undefined,
      value: form.value,
      description: form.description.trim() || null,
    };
    setSubmitLoading(true);
    setSubmitError(null);
    try {
      await adminCreateSetting(body);
      showSuccess("Setting berhasil dibuat.");
      closeModal();
      await loadAll();
    } catch (e) {
      setSubmitError(getFriendlyApiErrorMessage(e));
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    const key = form.key.trim();
    if (!key) {
      setSubmitError("Key wajib diisi.");
      return;
    }
    const body: AdminUpdateSettingRequest = {
      key,
      slug: form.slug.trim() || slugifyKey(key) || null,
      value: form.value,
      description: form.description.trim() || null,
    };
    setSubmitLoading(true);
    setSubmitError(null);
    try {
      await adminUpdateSetting(editingId, body);
      showSuccess("Setting diperbarui.");
      closeModal();
      await loadAll();
    } catch (e) {
      setSubmitError(getFriendlyApiErrorMessage(e));
    } finally {
      setSubmitLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await adminDeleteSetting(deleteId);
      showSuccess("Setting dihapus.");
      setDeleteId(null);
      await loadAll();
    } catch (e) {
      showError(getFriendlyApiErrorMessage(e));
    } finally {
      setDeleteLoading(false);
    }
  };

  const envKeySet = useMemo(() => new Set(envKeys.map((k) => k.toUpperCase())), [envKeys]);

  return (
    <div className="px-4 py-5 text-zinc-900 sm:px-6 md:px-8 md:py-8">
      {notice && (
        <div className="mb-4">
          <FlashNoticeBar kind={notice.kind} message={notice.text} onDismiss={clearNotice} />
        </div>
      )}

      <div className="mb-6 md:mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Master Data</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">Pengaturan sistem</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Kelola key-value di database (izin <span className="font-mono text-xs">master-data.manage</span>). Nilai sensitif
          ditampilkan utuh di sini; hanya untuk admin.
        </p>
      </div>

      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
        <p className="font-medium">Restart API setelah mengubah override</p>
        <p className="mt-1 text-amber-900/90">
          Pengaturan seperti <span className="font-mono">MIDTRANS_*</span> atau <span className="font-mono">JWT_SECRET</span>{" "}
          biasanya baru diterapkan setelah proses server backend di-restart.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
          <button
            type="button"
            onClick={() => void loadAll()}
            className="ml-3 font-medium underline-offset-2 hover:underline"
          >
            Muat ulang
          </button>
        </div>
      )}

      <section className="mb-8 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Key lingkungan (env)</h2>
            <p className="text-xs text-zinc-500">Daftar dari GET /admin/settings/env-keys</p>
          </div>
          {loading && <span className="text-xs text-zinc-400">Memuat…</span>}
        </div>
        {loading && envKeys.length === 0 ? (
          <div className="mt-3 space-y-2">
            <div className="h-7 w-full max-w-md animate-pulse rounded-lg bg-zinc-100" />
            <div className="h-7 w-full max-w-sm animate-pulse rounded-lg bg-zinc-100" />
          </div>
        ) : envKeys.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">Tidak ada data atau endpoint belum tersedia.</p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-2">
            {envKeys.map((k) => (
              <li key={k}>
                <span className="inline-flex rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 font-mono text-xs text-zinc-800">
                  {k}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-100 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Semua settings</h2>
            <p className="text-xs text-zinc-500">GET /admin/settings — ubah dengan tombol edit</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void loadAll()}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={openAdd}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Tambah setting
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-sm text-zinc-500">Memuat…</div>
          ) : list.length === 0 ? (
            <div className="p-8 text-center text-sm text-zinc-500">Belum ada setting. Tambah baru atau periksa izin akun.</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/80">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Key</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Slug</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Nilai</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Deskripsi</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {list.map((row) => {
                  const flagged = envKeySet.has(row.key.toUpperCase());
                  return (
                    <tr key={row.id} className="hover:bg-zinc-50/50">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-medium text-zinc-900">{row.key}</span>
                        {flagged && (
                          <span className="ml-2 rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold text-sky-800">
                            env
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-600">{row.slug ?? "—"}</td>
                      <td className="max-w-[240px] truncate px-4 py-3 font-mono text-xs text-zinc-800" title={row.value}>
                        {row.value}
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-zinc-600" title={row.description ?? ""}>
                        {row.description ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => void openEdit(row)}
                          className="mr-2 rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(row.id)}
                          className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {modalMode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="presentation"
          onClick={() => {
            if (!submitLoading) closeModal();
          }}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-setting-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="admin-setting-modal-title" className="text-lg font-semibold text-zinc-900">
              {modalMode === "add" ? "Setting baru" : "Edit setting"}
            </h3>
            {submitError && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{submitError}</div>
            )}
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700">Key</label>
                <input
                  value={form.key}
                  onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 font-mono text-sm"
                  placeholder="MIDTRANS_SERVER_KEY"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700">Slug</label>
                <input
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 font-mono text-sm"
                  placeholder="Opsional — diisi otomatis dari key"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700">Value</label>
                <textarea
                  value={form.value}
                  onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                  rows={4}
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700">Deskripsi</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={submitLoading}
                onClick={() => void (modalMode === "add" ? handleCreate() : handleUpdate())}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
              >
                {submitLoading ? "Menyimpan…" : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
          role="presentation"
          onClick={() => {
            if (!deleteLoading) setDeleteId(null);
          }}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-setting-delete-title"
            onClick={(e) => e.stopPropagation()}
          >
            <p id="admin-setting-delete-title" className="text-sm font-medium text-zinc-900">
              Hapus setting ini?
            </p>
            <p className="mt-2 text-sm text-zinc-600">Tindakan tidak dapat dibatalkan.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => void confirmDelete()}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleteLoading ? "Menghapus…" : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
