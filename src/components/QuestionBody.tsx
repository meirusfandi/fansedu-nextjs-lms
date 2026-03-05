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
    return <span className={className}>–</span>;
  }

  if (asPreview) {
    const stripped = combinedHtml
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const preview = stripped.length > 120 ? `${stripped.slice(0, 120)}…` : stripped;
    return (
      <p className={`text-sm text-zinc-900 dark:text-zinc-50 ${className}`}>
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
      className={`question-body text-sm text-zinc-900 ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
