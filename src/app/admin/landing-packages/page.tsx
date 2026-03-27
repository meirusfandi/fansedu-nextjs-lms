"use client";

import type { AdminLandingPackageCreateRequest, Course, LandingPackage } from "@/lib/api-types";
import {
  adminLandingCreatePackage,
  adminLandingDeletePackage,
  adminLandingListPackages,
  adminLandingUpdatePackage,
  adminListCourses,
  getFriendlyApiErrorMessage,
} from "@/lib/api";
import { useCallback, useEffect, useMemo, useState } from "react";

type FormState = {
  name: string;
  slug: string;
  short_description: string;
  price_early_bird: string;
  price_normal: string;
  is_open: boolean;
  is_bundle: boolean;
  durasi: string;
  materi: string;
  fasilitas: string;
  bonus: string;
  linked_course_ids: string[];
};

const emptyForm = (): FormState => ({
  name: "",
  slug: "",
  short_description: "",
  price_early_bird: "",
  price_normal: "",
  is_open: true,
  is_bundle: false,
  durasi: "",
  materi: "",
  fasilitas: "",
  bonus: "",
  linked_course_ids: [],
});

function parseLines(text: string): string[] | undefined {
  const arr = text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  return arr.length ? arr : undefined;
}

function normalizeIds(ids: string[]): string[] | undefined {
  const arr = ids.map((s) => s.trim()).filter(Boolean);
  return arr.length ? arr : undefined;
}

function parseNumberOrUndefined(text: string): number | undefined {
  const t = text.trim();
  if (!t) return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

export default function AdminLandingPackagesPage() {
  const [items, setItems] = useState<LandingPackage[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState<"add" | "edit" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pkg, c] = await Promise.all([adminLandingListPackages(), adminListCourses()]);
      setItems(Array.isArray(pkg) ? pkg : []);
      setCourses(Array.isArray(c) ? c : []);
    } catch (e) {
      setError(getFriendlyApiErrorMessage(e));
      setItems([]);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => {
    setForm(emptyForm());
    setEditingId(null);
    setModalOpen("add");
    setSaveError(null);
  };

  const openEdit = (p: LandingPackage) => {
    setForm({
      name: p.name ?? "",
      slug: p.slug ?? "",
      short_description: p.short_description ?? "",
      price_early_bird: p.price_early_bird != null ? String(p.price_early_bird) : "",
      price_normal: p.price_normal != null ? String(p.price_normal) : "",
      is_open: p.is_open !== false,
      is_bundle: p.is_bundle === true,
      durasi: p.durasi ?? "",
      materi: (p.materi ?? []).join("\n"),
      fasilitas: (p.fasilitas ?? []).join("\n"),
      bonus: (p.bonus ?? []).join("\n"),
      linked_course_ids: p.linked_course_ids ?? [],
    });
    setEditingId(p.id);
    setModalOpen("edit");
    setSaveError(null);
  };

  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      const name = form.name.trim();
      const slug = form.slug.trim();
      if (!name || !slug) {
        setSaveError("Nama dan slug wajib diisi.");
        return;
      }
      const payload: AdminLandingPackageCreateRequest = {
        name,
        slug,
        short_description: form.short_description.trim() || undefined,
        price_early_bird: parseNumberOrUndefined(form.price_early_bird),
        price_normal: parseNumberOrUndefined(form.price_normal),
        is_open: form.is_open,
        is_bundle: form.is_bundle,
        durasi: form.durasi.trim() || undefined,
        materi: parseLines(form.materi),
        fasilitas: parseLines(form.fasilitas),
        bonus: parseLines(form.bonus),
        linked_course_ids: normalizeIds(form.linked_course_ids),
      };
      if (modalOpen === "add") {
        await adminLandingCreatePackage(payload);
      } else if (modalOpen === "edit" && editingId) {
        await adminLandingUpdatePackage(editingId, payload);
      }
      setModalOpen(null);
      setEditingId(null);
      await load();
    } catch (err) {
      setSaveError(getFriendlyApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm("Hapus paket ini dari landing?")) return;
    (async () => {
      setSaving(true);
      setSaveError(null);
      try {
        await adminLandingDeletePackage(id);
        await load();
      } catch (err) {
        setSaveError(getFriendlyApiErrorMessage(err));
      } finally {
        setSaving(false);
      }
    })();
  };

  const sorted = useMemo(() => [...items].sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "")), [items]);
  const coursesSorted = useMemo(
    () => [...courses].sort((a, b) => (a.title ?? "").localeCompare(b.title ?? "")),
    [courses]
  );

  return (
    <div className="px-4 py-5 sm:px-6 md:px-8 md:py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 md:mb-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Manage</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
            Paket promo landing
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Kelola paket program yang tampil di landing publik (data dari backend:{" "}
            <code className="rounded bg-zinc-100 px-1">GET /api/v1/packages</code>, admin CRUD:{" "}
            <code className="rounded bg-zinc-100 px-1">/api/v1/admin/landing/packages</code>).
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 shadow-sm hover:bg-zinc-800"
        >
          + Tambah paket
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}
      {saveError && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {saveError}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-10 text-center text-sm text-zinc-600">Memuat paket…</div>
        ) : sorted.length === 0 ? (
          <div className="p-10 text-center text-sm text-zinc-600">
            Belum ada paket. Tambah paket pertama untuk ditampilkan di landing (aktifkan setidaknya satu).
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200 text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Nama</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Slug</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Harga</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {sorted.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-50/80">
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-900">{p.name}</p>
                      {p.short_description ? (
                        <p className="line-clamp-2 text-xs text-zinc-500">{p.short_description}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-600">{p.slug ?? "–"}</td>
                    <td className="px-4 py-3 text-zinc-800">
                      {p.price_early_bird != null ? (
                        <span className="mr-2 inline-flex rounded bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          EB: {p.price_early_bird.toLocaleString("id-ID")}
                        </span>
                      ) : null}
                      {p.price_normal != null ? (
                        <span className="inline-flex rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
                          Normal: {p.price_normal.toLocaleString("id-ID")}
                        </span>
                      ) : (
                        <span className="text-zinc-500">–</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {p.is_open === false ? "Tutup" : "Buka"}
                      {p.is_bundle ? <span className="ml-2 text-xs text-zinc-500">Bundle</span> : null}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        className="text-sky-600 hover:underline"
                      >
                        Edit
                      </button>
                      <span className="text-zinc-300"> | </span>
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id)}
                        className="text-red-600 hover:underline"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-900 shadow-xl [color-scheme:light]">
            <h2 className="text-lg font-semibold text-zinc-900">
              {modalOpen === "add" ? "Tambah paket" : "Edit paket"}
            </h2>
            <form onSubmit={handleSubmitModal} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-600">Nama *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">Slug *</label>
                <input
                  required
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder="paket-bundle-a-b"
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">Short description</label>
                <textarea
                  rows={2}
                  value={form.short_description}
                  onChange={(e) => setForm((f) => ({ ...f, short_description: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-600">Harga early bird</label>
                  <input
                    inputMode="numeric"
                    value={form.price_early_bird}
                    onChange={(e) => setForm((f) => ({ ...f, price_early_bird: e.target.value }))}
                    placeholder="499000"
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600">Harga normal</label>
                  <input
                    inputMode="numeric"
                    value={form.price_normal}
                    onChange={(e) => setForm((f) => ({ ...f, price_normal: e.target.value }))}
                    placeholder="799000"
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex items-center gap-2 text-sm text-zinc-800">
                  <input
                    type="checkbox"
                    checked={form.is_open}
                    onChange={(e) => setForm((f) => ({ ...f, is_open: e.target.checked }))}
                    className="rounded border-zinc-300"
                  />
                  Paket dibuka (is_open)
                </label>
                <label className="flex items-center gap-2 text-sm text-zinc-800">
                  <input
                    type="checkbox"
                    checked={form.is_bundle}
                    onChange={(e) => setForm((f) => ({ ...f, is_bundle: e.target.checked }))}
                    className="rounded border-zinc-300"
                  />
                  Bundle (is_bundle)
                </label>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">Durasi</label>
                <input
                  value={form.durasi}
                  onChange={(e) => setForm((f) => ({ ...f, durasi: e.target.value }))}
                  placeholder="8 Minggu"
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">Materi (1 baris = 1 item)</label>
                <textarea
                  rows={3}
                  value={form.materi}
                  onChange={(e) => setForm((f) => ({ ...f, materi: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">Fasilitas (1 baris = 1 item)</label>
                <textarea
                  rows={3}
                  value={form.fasilitas}
                  onChange={(e) => setForm((f) => ({ ...f, fasilitas: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">Bonus (1 baris = 1 item)</label>
                <textarea
                  rows={2}
                  value={form.bonus}
                  onChange={(e) => setForm((f) => ({ ...f, bonus: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">Linked courses</label>
                <select
                  multiple
                  value={form.linked_course_ids}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
                    setForm((f) => ({ ...f, linked_course_ids: selected }));
                  }}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                  size={Math.min(10, Math.max(4, coursesSorted.length))}
                >
                  {coursesSorted.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-zinc-500">
                  Tahan <kbd className="rounded border border-zinc-200 bg-white px-1">Cmd</kbd> (Mac) /{" "}
                  <kbd className="rounded border border-zinc-200 bg-white px-1">Ctrl</kbd> (Windows) untuk pilih banyak.
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(null);
                    setSaveError(null);
                  }}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                >
                  {saving ? "Menyimpan…" : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
