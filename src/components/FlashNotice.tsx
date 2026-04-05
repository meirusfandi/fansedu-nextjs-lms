"use client";

import { useEffect, useState } from "react";

type NoticeKind = "success" | "error";

/**
 * Banner singkat untuk umpan balik simpan / edit / hapus (auto hilang).
 */
export function FlashNoticeBar({
  kind,
  message,
  onDismiss,
  className = "",
}: {
  kind: NoticeKind;
  message: string;
  onDismiss?: () => void;
  className?: string;
}) {
  const styles =
    kind === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-950"
      : "border-red-200 bg-red-50 text-red-800";

  return (
    <div
      role="status"
      className={`flex items-start justify-between gap-3 rounded-lg border px-3 py-2 text-sm ${styles} ${className}`}
    >
      <p className="min-w-0 flex-1">{message}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded px-1.5 py-0.5 text-xs font-medium opacity-80 hover:opacity-100"
          aria-label="Tutup"
        >
          ✕
        </button>
      )}
    </div>
  );
}

const DEFAULT_MS = 6000;

/** State notifikasi sukses/gagal dengan auto-clear. */
export function useFlashNotice(autoHideMs: number = DEFAULT_MS) {
  const [notice, setNotice] = useState<{ kind: NoticeKind; text: string } | null>(null);

  useEffect(() => {
    if (!notice || autoHideMs <= 0) return;
    const t = setTimeout(() => setNotice(null), autoHideMs);
    return () => clearTimeout(t);
  }, [notice, autoHideMs]);

  return {
    notice,
    showSuccess: (text: string) => setNotice({ kind: "success", text }),
    showError: (text: string) => setNotice({ kind: "error", text }),
    clearNotice: () => setNotice(null),
  };
}
