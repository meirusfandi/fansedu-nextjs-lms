"use client";

/**
 * Merender body soal yang dapat berisi HTML, kode (<pre><code>), dan gambar.
 * Dipakai di: admin list soal, admin detail/edit, halaman test siswa.
 */
export function QuestionBody({
  html,
  imageUrl,
  className = "",
  asPreview = false,
}: {
  html: string;
  /** URL gambar dari API (jika backend mengembalikan terpisah dari body). */
  imageUrl?: string | null;
  className?: string;
  /** Jika true, tampilkan sebagai teks singkat (strip HTML) untuk list. */
  asPreview?: boolean;
}) {
  const combinedHtml = imageUrl
    ? `${html || ""}<img src="${imageUrl}" alt="Gambar soal" class="question-body-img" />`
    : (html || "");

  if (!combinedHtml.trim()) {
    return (
      <span className={`text-sm text-zinc-800 [color-scheme:light] ${className}`}>–</span>
    );
  }

  if (asPreview) {
    const stripped = combinedHtml
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const preview = stripped.length > 120 ? `${stripped.slice(0, 120)}…` : stripped;
    /* Jangan pakai dark:text-* di sini: kartu admin putih; prefers-color-scheme dark membuat teks nyaris tak terbaca. */
    return (
      <p
        className={`text-sm font-normal text-zinc-900 [color-scheme:light] ${className}`.trim()}
      >
        {preview}
      </p>
    );
  }

  // Sanitasi minimal: hapus script/style untuk mengurangi XSS (konten dari admin)
  const sanitized = combinedHtml
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");

  return (
    <div
      className={`question-body text-sm text-zinc-900 [color-scheme:light] ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
