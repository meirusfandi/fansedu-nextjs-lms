"use client";

import { useEffect, useRef, useState } from "react";
import type { AdminClass } from "./local-kelas-storage";
import { LOCAL_ADMIN_CLASSES_KEY } from "./local-kelas-storage";

/**
 * State kelas demo (localStorage) — dipakai halaman daftar `/admin/kelas` dan detail modul `/admin/kelas/[id]`.
 */
export function useAdminLocalClasses() {
  const [classes, setClasses] = useState<AdminClass[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const skipNextLocalStorageWrite = useRef(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_ADMIN_CLASSES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AdminClass[];
        const list = Array.isArray(parsed) ? parsed : [];
        setClasses(list);
      }
    } catch {
      setClasses([]);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (skipNextLocalStorageWrite.current) {
      skipNextLocalStorageWrite.current = false;
      return;
    }
    try {
      localStorage.setItem(LOCAL_ADMIN_CLASSES_KEY, JSON.stringify(classes));
    } catch {
      // quota / private mode
    }
  }, [classes]);

  return { classes, setClasses, hydrated };
}
