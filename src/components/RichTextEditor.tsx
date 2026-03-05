"use client";

import { useEffect, useRef, useState } from "react";

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

function exec(command: string, value?: string) {
  if (typeof document === "undefined") return;
  document.execCommand(command, false, value);
}

function insertHtml(html: string) {
  if (typeof window === "undefined") return;
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) {
    exec("insertHTML", html);
    return;
  }
  const range = sel.getRangeAt(0);
  range.deleteContents();
  const temp = document.createElement("div");
  temp.innerHTML = html;
  const frag = document.createDocumentFragment();
  let node: ChildNode | null;
  while ((node = temp.firstChild)) {
    frag.appendChild(node);
  }
  range.insertNode(frag);
  range.collapse(false);
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Tulis konten di sini...",
  minHeight = 240,
}: RichTextEditorProps) {
  const [codeView, setCodeView] = useState(false);
  const editableRef = useRef<HTMLDivElement | null>(null);

  // Sinkronisasi nilai dari luar ke editor (mode WYSIWYG)
  useEffect(() => {
    if (codeView) return;
    const el = editableRef.current;
    if (!el) return;
    if (el.innerHTML !== (value || "")) {
      el.innerHTML = value || "";
    }
  }, [value, codeView]);

  const handleInput = () => {
    const el = editableRef.current;
    if (!el) return;
    onChange(el.innerHTML);
  };

  const handleToggleCode = () => {
    setCodeView((prev) => !prev);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      insertHtml(`<img src="${dataUrl}" alt="Gambar" />`);
      const el = editableRef.current;
      if (el) onChange(el.innerHTML);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleInsertVideo = () => {
    const url = prompt("Masukkan URL video (YouTube, dsb.):");
    if (!url) return;
    const escaped = url.trim();
    const html = `<div class="aspect-video w-full"><iframe src="${escaped}" frameborder="0" allowfullscreen class="h-full w-full"></iframe></div>`;
    insertHtml(html);
    const el = editableRef.current;
    if (el) onChange(el.innerHTML);
  };

  return (
    <div className="w-full rounded-lg border border-zinc-200 bg-white text-xs text-zinc-800 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-zinc-200 bg-zinc-50 px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900/70">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => exec("bold")}
            className="rounded-md px-2 py-1 text-[11px] font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-800"
          >
            B
          </button>
          <button
            type="button"
            onClick={() => exec("underline")}
            className="rounded-md px-2 py-1 text-[11px] font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-800"
          >
            U
          </button>
          <button
            type="button"
            onClick={() => exec("italic")}
            className="rounded-md px-2 py-1 text-[11px] font-semibold italic hover:bg-zinc-200 dark:hover:bg-zinc-800"
          >
            I
          </button>
        </div>
        <div className="mx-1 h-5 w-px bg-zinc-200 dark:bg-zinc-700" />
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => exec("insertUnorderedList")}
            className="rounded-md px-2 py-1 text-[11px] hover:bg-zinc-200 dark:hover:bg-zinc-800"
          >
            • List
          </button>
          <button
            type="button"
            onClick={() => exec("insertOrderedList")}
            className="rounded-md px-2 py-1 text-[11px] hover:bg-zinc-200 dark:hover:bg-zinc-800"
          >
            1. List
          </button>
        </div>
        <div className="mx-1 h-5 w-px bg-zinc-200 dark:bg-zinc-700" />
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => exec("justifyLeft")}
            className="rounded-md px-2 py-1 text-[11px] hover:bg-zinc-200 dark:hover:bg-zinc-800"
          >
            ⬅︎
          </button>
          <button
            type="button"
            onClick={() => exec("justifyCenter")}
            className="rounded-md px-2 py-1 text-[11px] hover:bg-zinc-200 dark:hover:bg-zinc-800"
          >
            ⬌
          </button>
          <button
            type="button"
            onClick={() => exec("justifyRight")}
            className="rounded-md px-2 py-1 text-[11px] hover:bg-zinc-200 dark:hover:bg-zinc-800"
          >
            ➡︎
          </button>
        </div>
        <div className="mx-1 h-5 w-px bg-zinc-200 dark:bg-zinc-700" />
        <div className="flex items-center gap-1">
          <label className="inline-flex cursor-pointer items-center rounded-md px-2 py-1 text-[11px] hover:bg-zinc-200 dark:hover:bg-zinc-800">
            <span>🖼 Gambar</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
          <button
            type="button"
            onClick={handleInsertVideo}
            className="rounded-md px-2 py-1 text-[11px] hover:bg-zinc-200 dark:hover:bg-zinc-800"
          >
            ▶︎ Video
          </button>
          <button
            type="button"
            onClick={() => {
              const url = prompt("Masukkan URL tautan:");
              if (!url) return;
              exec("createLink", url);
            }}
            className="rounded-md px-2 py-1 text-[11px] hover:bg-zinc-200 dark:hover:bg-zinc-800"
          >
            🔗 Link
          </button>
        </div>
        <div className="mx-1 h-5 w-px bg-zinc-200 dark:bg-zinc-700" />
        <button
          type="button"
          onClick={handleToggleCode}
          className="ml-auto rounded-md px-2 py-1 text-[11px] font-medium hover:bg-zinc-200 dark:hover:bg-zinc-800"
        >
          {codeView ? "<> WYSIWYG" : "<> Code"}
        </button>
      </div>

      {/* Editor area */}
      <div
        className="max-h-[420px] overflow-y-auto px-3 py-2 text-xs sm:text-sm"
        style={{ minHeight }}
      >
        {codeView ? (
          <textarea
            className="h-[220px] w-full resize-none rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1.5 font-mono text-[11px] leading-snug dark:border-zinc-700 dark:bg-zinc-900"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        ) : (
          <div
            ref={editableRef}
            className="min-h-[160px] whitespace-pre-wrap break-words text-xs leading-relaxed text-zinc-800 outline-none dark:text-zinc-100"
            contentEditable
            data-placeholder={placeholder}
            onInput={handleInput}
            suppressContentEditableWarning
          />
        )}
      </div>
    </div>
  );
}

