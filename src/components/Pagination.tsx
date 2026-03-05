"use client";

export const PAGE_SIZE = 10;

type PaginationProps = {
  currentPage: number;
  totalItems: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  label?: string;
};

export function Pagination({
  currentPage,
  totalItems,
  pageSize = PAGE_SIZE,
  onPageChange,
  label = "item",
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 bg-zinc-50/80 px-4 py-3">
      <p className="text-xs text-zinc-600">
        Menampilkan {start}–{end} dari {totalItems} {label}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 shadow-sm disabled:cursor-not-allowed disabled:opacity-50 hover:bg-zinc-100 hover:border-zinc-400"
        >
          Sebelumnya
        </button>
        <span className="text-xs text-zinc-500">
          Halaman {currentPage} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 shadow-sm disabled:cursor-not-allowed disabled:opacity-50 hover:bg-zinc-100 hover:border-zinc-400"
        >
          Selanjutnya
        </button>
      </div>
    </div>
  );
}
