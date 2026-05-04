"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminClass, AdminClassExtra } from "./local-kelas-storage";
import {
  COURSE_EXTRAS_KEY,
  LOCAL_ADMIN_CLASSES_KEY,
  loadCourseExtras,
  nowIso,
  saveCourseExtras,
} from "./local-kelas-storage";
import {
  adminCreateCourse,
  adminDeleteCourse,
  adminListCourses,
  adminUpdateCourse,
  getFriendlyApiErrorMessage,
} from "@/lib/api";
import type { Course } from "@/lib/api-types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mergeWithExtra(course: Course, extra?: AdminClassExtra): AdminClass {
  return {
    id: course.id,
    title: course.title,
    description: course.description ?? undefined,
    subjectId: course.subjectId ?? undefined,
    status: (course.status as AdminClass["status"]) ?? "draft",
    levelId: extra?.levelId,
    levelName: extra?.levelName,
    subjectName: extra?.subjectName,
    trainerId: extra?.trainerId,
    trainerName: extra?.trainerName,
    startDate: extra?.startDate,
    endDate: extra?.endDate,
    modules: extra?.modules ?? [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
}

function buildExtra(cls: AdminClass): AdminClassExtra {
  return {
    levelId: cls.levelId,
    levelName: cls.levelName,
    subjectName: cls.subjectName,
    trainerId: cls.trainerId,
    trainerName: cls.trainerName,
    startDate: cls.startDate,
    endDate: cls.endDate,
    modules: cls.modules,
  };
}

function persistExtras(classes: AdminClass[]): void {
  const extras: Record<string, AdminClassExtra> = {};
  for (const c of classes) {
    extras[c.id] = buildExtra(c);
  }
  saveCourseExtras(extras);
}

/** Load data lama (fansedu_admin_classes_v2) untuk fallback/migrasi. */
function loadLegacyClasses(): AdminClass[] {
  try {
    const raw = localStorage.getItem(LOCAL_ADMIN_CLASSES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AdminClass[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Input type untuk create/update
// ---------------------------------------------------------------------------

export type AddCourseInput = {
  title: string;
  description: string;
  subjectId: string;
  subjectName?: string;
  levelId: string;
  levelName?: string;
  trainerId: string;
  trainerName?: string;
  startDate: string;
  endDate: string;
  status: AdminClass["status"];
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Hook utama manajemen kelas admin.
 * - Metadata kelas (title, desc, subject, status) → backend API `/admin/courses`.
 * - Extra fields (level, trainer, tanggal) + modules → localStorage per courseId.
 * - Fallback ke data lokal lama (v2) jika backend kosong atau tidak dapat dicapai.
 */
export function useAdminLocalClasses() {
  const [classes, setClassesState] = useState<AdminClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // Load: backend + local extras
  // -------------------------------------------------------------------------

  const loadAll = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const courses = await adminListCourses();
      const extras = loadCourseExtras();

      if (courses.length === 0) {
        // Fallback: jika backend kosong, coba data lokal lama
        const legacy = loadLegacyClasses();
        setClassesState(legacy);
      } else {
        setClassesState(courses.map((c) => mergeWithExtra(c, extras[c.id])));
      }
    } catch (e) {
      setApiError(getFriendlyApiErrorMessage(e));
      // Fallback ke data lokal lama jika API gagal
      const legacy = loadLegacyClasses();
      setClassesState(legacy);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // -------------------------------------------------------------------------
  // setClasses: untuk update modules (dipakai halaman detail modul)
  // Hanya menyimpan ke localStorage — tidak memanggil backend.
  // -------------------------------------------------------------------------

  const setClasses = useCallback(
    (updater: AdminClass[] | ((prev: AdminClass[]) => AdminClass[])) => {
      setClassesState((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        persistExtras(next);
        return next;
      });
    },
    []
  );

  // -------------------------------------------------------------------------
  // addCourse: POST ke backend, simpan extras ke localStorage
  // -------------------------------------------------------------------------

  const addCourse = useCallback(async (input: AddCourseInput): Promise<AdminClass> => {
    setSaving(true);
    setApiError(null);
    try {
      const rawCreated = await adminCreateCourse({
        title: input.title.trim(),
        description: input.description.trim() || null,
        subjectId: input.subjectId || null,
        status: input.status,
      });

      // adminCreateCourse sudah mengembalikan Course yang ternormalisasi.
      const createdId = String(rawCreated.id ?? "");
      if (!createdId) throw new Error("Server tidak mengembalikan ID kelas baru.");

      const newClass: AdminClass = {
        id: createdId,
        title: input.title.trim(),
        description: input.description.trim() || undefined,
        subjectId: input.subjectId || undefined,
        subjectName: input.subjectName,
        levelId: input.levelId || undefined,
        levelName: input.levelName,
        trainerId: input.trainerId || undefined,
        trainerName: input.trainerName,
        startDate: input.startDate || undefined,
        endDate: input.endDate || undefined,
        status: input.status,
        modules: [],
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };

      setClassesState((prev) => {
        const next = [newClass, ...prev];
        persistExtras(next);
        return next;
      });

      return newClass;
    } finally {
      setSaving(false);
    }
  }, []);

  // -------------------------------------------------------------------------
  // updateCourse: PUT ke backend, update extras di localStorage
  // -------------------------------------------------------------------------

  const updateCourse = useCallback(async (courseId: string, input: AddCourseInput): Promise<void> => {
    setSaving(true);
    setApiError(null);
    try {
      await adminUpdateCourse(courseId, {
        title: input.title.trim(),
        description: input.description.trim() || null,
        subjectId: input.subjectId || null,
        status: input.status,
      });

      setClassesState((prev) => {
        const next = prev.map((c) =>
          c.id === courseId
            ? {
                ...c,
                title: input.title.trim(),
                description: input.description.trim() || undefined,
                subjectId: input.subjectId || undefined,
                subjectName: input.subjectName,
                levelId: input.levelId || undefined,
                levelName: input.levelName,
                trainerId: input.trainerId || undefined,
                trainerName: input.trainerName ?? c.trainerName,
                startDate: input.startDate || undefined,
                endDate: input.endDate || undefined,
                status: input.status,
                updatedAt: nowIso(),
              }
            : c
        );
        persistExtras(next);
        return next;
      });
    } finally {
      setSaving(false);
    }
  }, []);

  // -------------------------------------------------------------------------
  // deleteCourse: DELETE dari backend, hapus extras dari localStorage
  // -------------------------------------------------------------------------

  const deleteCourse = useCallback(async (courseId: string): Promise<void> => {
    setSaving(true);
    setApiError(null);
    try {
      await adminDeleteCourse(courseId);

      setClassesState((prev) => {
        const next = prev.filter((c) => c.id !== courseId);
        // Hapus extras courseId ini dari localStorage
        const extras = loadCourseExtras();
        delete extras[courseId];
        saveCourseExtras(extras);
        return next;
      });
    } finally {
      setSaving(false);
    }
  }, []);

  // -------------------------------------------------------------------------
  // Return
  // -------------------------------------------------------------------------

  return {
    classes,
    setClasses,
    loading,
    saving,
    apiError,
    reload: loadAll,
    addCourse,
    updateCourse,
    deleteCourse,
    /** @deprecated Gunakan loading. Dipertahankan untuk backward-compat. */
    hydrated: !loading,
  };
}
