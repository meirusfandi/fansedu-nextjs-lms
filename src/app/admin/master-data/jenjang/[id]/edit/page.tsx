"use client";

import {
  adminGetLevel,
  adminUpdateLevel,
} from "@/lib/api";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditJenjangPendidikanPage() {
  const router = useRouter();
  const params = useParams();
  const levelId = params?.id as string | undefined;
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    sort_order: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!levelId) {
      setLoading(false);
      setError("ID tidak valid.");
      return;
    }
    adminGetLevel(levelId)
      .then((level) => {
        setForm({
          name: level.name ?? "",
          slug: level.slug ?? "",
          description: level.description ?? "",
          sort_order:
            level.sort_order != null ? String(level.sort_order) : "",
        });
      })
      .catch((e) => {
        setError((e as Error).message ?? "Gagal memuat data jenjang.");
      })
      .finally(() => setLoading(false));
  }, [levelId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!levelId) return;
    setSubmitError(null);
    const name = form.name.trim();
    const slug = form.slug.trim();
    if (!name || !slug) {
      setSubmitError("Nama dan slug wajib diisi.");
      return;
    }
    setSaving(true);
    try {
      const body: {
        name: string;
        slug: string;
        description?: string;
        sort_order?: number;
      } = { name, slug };
      if (form.description.trim()) body.description = form.description.trim();
      const sortNum = parseInt(form.sort_order, 10);
      if (!Number.isNaN(sortNum)) body.sort_order = sortNum;
      await adminUpdateLevel(levelId, body);
      router.push("/admin/master-data/jenjang");
    } catch (err) {
      setSubmitError((err as Error).message ?? "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-5 sm:px-6 md:px-8 md:py-8">
        <p className="text-sm text-zinc-500">Memuat...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-5 sm:px-6 md:px-8 md:py-8">
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
        <Link
          href="/admin/master-data/jenjang"
          className="mt-4 inline-block text-sm font-medium text-zinc-600"
        >
          ← Kembali ke list
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 py-5 sm:px-6 md:px-8 md:py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 md:mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Master Data · Jenjang Pendidikan
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
              Edit Jenjang Pendidikan
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Ubah data jenjang.
            </p>
          </div>
          <Link
            href="/admin/master-data/jenjang"
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            ← Kembali ke list
          </Link>
        </div>

        <form
          onSubmit={handleSubmit}
          className="max-w-xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
        >
          {submitError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {submitError}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-600">
                Nama Jenjang *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Mis. SMP, Sekolah Menengah Pertama"
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-600">
                Slug *
              </label>
              <input
                type="text"
                required
                value={form.slug}
                onChange={(e) =>
                  setForm({
                    ...form,
                    slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                  })
                }
                placeholder="Mis. smp, sd, sma"
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-600">
                Deskripsi (opsional)
              </label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Sekolah Menengah Pertama (updated)"
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
              />
            </div>

            <div className="max-w-[8rem]">
              <label className="block text-xs font-medium text-zinc-600">
                Urutan (opsional)
              </label>
              <input
                type="number"
                min={0}
                value={form.sort_order}
                onChange={(e) =>
                  setForm({ ...form, sort_order: e.target.value })
                }
                placeholder="1"
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 hover:bg-zinc-800 disabled:opacity-50"
            >
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
            <Link
              href="/admin/master-data/jenjang"
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
            >
              Batal
            </Link>
          </div>
        </form>
    </div>
  );
}
