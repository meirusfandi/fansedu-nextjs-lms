"use client";

import { AdminSidebar } from "@/components/AdminSidebar";
import { Pagination, PAGE_SIZE } from "@/components/Pagination";
import { logout, clearAuthToken } from "@/lib/api";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

export type EventCategorySlug = "tryout" | "free_class" | "paid_class";

export interface EventCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
}

const DEFAULT_CATEGORIES: EventCategory[] = [
  { id: "1", name: "Tryout", slug: "tryout", description: "Sesi tryout / simulasi ujian." },
  { id: "2", name: "Free Class", slug: "free_class", description: "Kelas gratis." },
  { id: "3", name: "Paid Class", slug: "paid_class", description: "Kelas berbayar." },
];

export default function MasterDataEventPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [categories, setCategories] = useState<EventCategory[]>(DEFAULT_CATEGORIES);
  const [modalOpen, setModalOpen] = useState<"add" | "edit" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", description: "" });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const paginatedCategories = useMemo(
    () => categories.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [categories, page]
  );

  const handleLogout = useCallback(() => {
    logout().catch(() => {});
    clearAuthToken();
    router.push("/login");
  }, [router]);

  const openAdd = () => {
    setForm({ name: "", slug: "", description: "" });
    setEditingId(null);
    setModalOpen("add");
    setSubmitError(null);
  };

  const openEdit = (cat: EventCategory) => {
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
    });
    setEditingId(cat.id);
    setModalOpen("edit");
    setSubmitError(null);
  };

  const closeModal = () => {
    setModalOpen(null);
    setEditingId(null);
    setForm({ name: "", slug: "", description: "" });
    setSubmitError(null);
  };

  const slugFromName = (name: string) =>
    name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const name = form.name.trim();
    const slug = form.slug.trim() || slugFromName(name);
    const description = form.description.trim();
    if (!name) {
      setSubmitError("Nama kategori wajib diisi.");
      return;
    }
    if (modalOpen === "add") {
      setCategories((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          name,
          slug: slug || "kategori",
          description: description || "—",
        },
      ]);
    } else if (editingId) {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === editingId
            ? { ...c, name, slug: slug || c.slug, description: description || "—" }
            : c
        )
      );
    }
    closeModal();
  };

  const handleDelete = (id: string) => {
    if (!confirm("Hapus kategori ini?")) return;
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-900">
      <AdminSidebar currentPath={pathname ?? ""} onLogout={handleLogout} />
      <main className="flex-1 px-4 py-5 sm:px-6 md:px-8 md:py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 md:mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Master Data
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
              Event
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Kategori event: tryout, free class, paid class. Kelola jenis event yang tersedia di platform.
            </p>
          </div>
          <button
            type="button"
            onClick={openAdd}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 hover:bg-zinc-800"
          >
            + Tambah Kategori
          </button>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200 text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">
                    Nama
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">
                    Slug
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">
                    Deskripsi
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-500">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {paginatedCategories.map((cat) => (
                  <tr
                    key={cat.id}
                    className="hover:bg-zinc-50"
                  >
                    <td className="px-4 py-3 font-medium text-zinc-900">
                      {cat.name}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs">
                        {cat.slug}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {cat.description}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(cat)}
                        className="mr-2 text-zinc-600 underline hover:text-zinc-900"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(cat.id)}
                        className="text-red-600 underline hover:text-red-700"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {categories.length > 0 && (
            <Pagination
              currentPage={page}
              totalItems={categories.length}
              onPageChange={setPage}
              label="kategori"
            />
          )}
        </div>

        <p className="mt-4 text-xs text-zinc-500">
          Sesi tryout (buat soal, jadwal) dikelola di menu <strong>Tryout</strong>. Di sini hanya kategori/jenis event.
        </p>
      </main>

      {modalOpen && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-zinc-900">
              {modalOpen === "add" ? "Tambah Kategori Event" : "Edit Kategori Event"}
            </h2>
            {submitError && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {submitError}
              </div>
            )}
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-600">
                  Nama *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => {
                    setForm((f) => ({
                      ...f,
                      name: e.target.value,
                      slug: modalOpen === "add" ? slugFromName(e.target.value) : f.slug,
                    }));
                  }}
                  placeholder="Contoh: Tryout, Free Class"
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">
                  Slug (kode)
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="tryout, free_class, paid_class"
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">
                  Deskripsi
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Keterangan singkat"
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 hover:bg-zinc-800"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
