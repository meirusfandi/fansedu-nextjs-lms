"use client";

import { useCallback, useEffect, useState } from "react";
import {
  adminCreateCourse,
  adminDeleteCourse,
  adminGetCourse,
  adminListCourses,
  adminUpdateCourse,
  getFriendlyApiErrorMessage,
} from "@/lib/api";
import type { AdminCreateCourseRequest, Course, CoursePublicationStatus } from "@/lib/api-types";

// ---------------------------------------------------------------------------
// Input type untuk create/update (hanya field yang didukung API)
// ---------------------------------------------------------------------------

export type AddCourseInput = {
  title: string;
  description: string;
  subjectId: string;
  status: CoursePublicationStatus | string;
};

export type UseAdminLocalClassesOptions = {
  /**
   * Jika diisi, hook hanya memuat 1 kelas dari backend.
   */
  activeCourseId?: string;
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/** Manajemen kelas admin — data dari API saja. */
export function useAdminLocalClasses(options?: UseAdminLocalClassesOptions) {
  const [classes, setClassesState] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const activeCourseId = String(options?.activeCourseId ?? "").trim();

  const loadAll = useCallback(async () => {
    setLoading(true);
    setApiError(null);

    if (activeCourseId) {
      try {
        const course = await adminGetCourse(activeCourseId);
        setClassesState([course]);
      } catch (e) {
        setApiError(getFriendlyApiErrorMessage(e));
        setClassesState([]);
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const courses = await adminListCourses();
      setClassesState(courses);
    } catch (e) {
      setApiError(getFriendlyApiErrorMessage(e));
      setClassesState([]);
    } finally {
      setLoading(false);
    }
  }, [activeCourseId]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const addCourse = useCallback(async (input: AddCourseInput): Promise<Course> => {
    setSaving(true);
    setApiError(null);
    try {
      const body: AdminCreateCourseRequest = {
        title: input.title.trim(),
        description: input.description.trim() || null,
        subjectId: input.subjectId || null,
        status: input.status,
      };
      const rawCreated = await adminCreateCourse(body);
      const createdId = String(rawCreated.id ?? "");
      if (!createdId) throw new Error("Server tidak mengembalikan ID kelas baru.");
      setClassesState((prev) => {
        const exists = prev.some((c) => c.id === createdId);
        if (exists) {
          return prev.map((c) => (c.id === createdId ? rawCreated : c));
        }
        return [rawCreated, ...prev];
      });
      return rawCreated;
    } finally {
      setSaving(false);
    }
  }, []);

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

      setClassesState((prev) =>
        prev.map((c) =>
          c.id === courseId
            ? {
                ...c,
                title: input.title.trim(),
                description: input.description.trim() || null,
                subjectId: input.subjectId || null,
                status: input.status,
              }
            : c
        )
      );
    } finally {
      setSaving(false);
    }
  }, []);

  const deleteCourse = useCallback(async (courseId: string): Promise<void> => {
    setSaving(true);
    setApiError(null);
    try {
      await adminDeleteCourse(courseId);
      setClassesState((prev) => prev.filter((c) => c.id !== courseId));
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    classes,
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
