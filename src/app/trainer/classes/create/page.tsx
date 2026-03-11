"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useCreateTrainerCourse } from "@/hooks/useDashboardQueries";
import { getFriendlyApiErrorMessage } from "@/lib/api";

export default function TrainerCreateClassPage() {
  const router = useRouter();
  const createCourse = useCreateTrainerCourse();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await createCourse.mutateAsync({ title: title.trim(), description: description.trim() || undefined });
      router.push("/trainer/classes");
    } catch (err) {
      // Error is shown via createCourse.error or we can set local error state
    }
  };

  return (
    <div>
      <h1 className="text-xl font-semibold text-zinc-900">Buat Kelas</h1>
      <p className="mt-1 text-sm text-zinc-500">Integrasi POST /trainer/courses.</p>

      <form onSubmit={handleSubmit} className="mt-6 max-w-md space-y-4">
        {createCourse.error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {getFriendlyApiErrorMessage(createCourse.error)}
          </div>
        )}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-zinc-800">
            Judul
          </label>
          <input
            id="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-sky-500 focus:bg-white focus:ring-1 focus:ring-sky-500"
            placeholder="Contoh: Persiapan OSN 2026"
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-zinc-800">
            Deskripsi (opsional)
          </label>
          <textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-sky-500 focus:bg-white focus:ring-1 focus:ring-sky-500"
            placeholder="Deskripsi singkat kelas"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={createCourse.isPending}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
          >
            {createCourse.isPending ? "Membuat..." : "Buat kelas"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  );
}
