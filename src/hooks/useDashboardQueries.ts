"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getStudentDashboard,
  getStudentTryouts,
  getStudentCourses,
  getStudentCoursesBySubject,
  getStudentPayments,
  getAdminDashboardData,
  getAdminOverview,
  adminGetTryoutAnalysis,
  adminGetTryoutStudents,
  adminGetTryoutAttemptAiAnalysis,
  getTrainerStatus,
  getTrainerProfile,
  listTrainerCourses,
  createTrainerCourse,
  getDashboard,
  listNotifications,
  markNotificationRead,
  listPayments,
  createPayment,
} from "@/lib/api";
import type { TrainerCourseCreateRequest, CreatePaymentRequest } from "@/lib/api-types";

export const queryKeys = {
  studentDashboard: ["student", "dashboard"] as const,
  studentTryouts: ["student", "tryouts"] as const,
  studentCourses: ["student", "courses"] as const,
  studentCoursesBySubject: ["student", "courses", "by-subject"] as const,
  studentPayments: ["student", "payments"] as const,
  adminDashboard: ["admin", "dashboard"] as const,
  adminOverview: ["admin", "overview"] as const,
  adminTryoutAnalysis: (tryoutId: string) => ["admin", "tryouts", tryoutId, "analysis"] as const,
  adminTryoutStudents: (tryoutId: string) => ["admin", "tryouts", tryoutId, "students"] as const,
  adminTryoutAttemptAiAnalysis: (tryoutId: string, attemptId: string) =>
    ["admin", "tryouts", tryoutId, "attempts", attemptId, "ai-analysis"] as const,
  trainerStatus: ["trainer", "status"] as const,
  trainerProfile: ["trainer", "profile"] as const,
  trainerCourses: ["trainer", "courses"] as const,
  dashboard: ["dashboard"] as const,
  notifications: ["notifications"] as const,
  payments: ["payments"] as const,
};

export function useStudentDashboard() {
  return useQuery({
    queryKey: queryKeys.studentDashboard,
    queryFn: getStudentDashboard,
  });
}

export function useStudentTryouts() {
  return useQuery({
    queryKey: queryKeys.studentTryouts,
    queryFn: getStudentTryouts,
  });
}

export function useStudentCourses() {
  return useQuery({
    queryKey: queryKeys.studentCourses,
    queryFn: getStudentCourses,
  });
}

/** Kelas yang sesuai subject siswa (GET /student/courses/by-subject). */
export function useStudentCoursesBySubject() {
  return useQuery({
    queryKey: queryKeys.studentCoursesBySubject,
    queryFn: getStudentCoursesBySubject,
  });
}

export function useStudentPayments() {
  return useQuery({
    queryKey: queryKeys.studentPayments,
    queryFn: getStudentPayments,
  });
}

export function useAdminDashboard() {
  return useQuery({
    queryKey: queryKeys.adminDashboard,
    queryFn: getAdminDashboardData,
  });
}

export function useAdminOverview() {
  return useQuery({
    queryKey: queryKeys.adminOverview,
    queryFn: getAdminOverview,
  });
}

/** Analisis & grafik per tryout (per soal). GET /admin/tryouts/:tryoutId/analysis */
export function useAdminTryoutAnalysis(tryoutId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.adminTryoutAnalysis(tryoutId ?? ""),
    queryFn: () => adminGetTryoutAnalysis(tryoutId!),
    enabled: !!tryoutId,
  });
}

/** Daftar siswa yang submit tryout. GET /admin/tryouts/:tryoutId/students */
export function useAdminTryoutStudents(tryoutId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.adminTryoutStudents(tryoutId ?? ""),
    queryFn: () => adminGetTryoutStudents(tryoutId!),
    enabled: !!tryoutId,
  });
}

/** Analisis AI per attempt. GET /admin/tryouts/:tryoutId/attempts/:attemptId/ai-analysis */
export function useAdminTryoutAttemptAiAnalysis(
  tryoutId: string | undefined,
  attemptId: string | undefined
) {
  return useQuery({
    queryKey: queryKeys.adminTryoutAttemptAiAnalysis(tryoutId ?? "", attemptId ?? ""),
    queryFn: () => adminGetTryoutAttemptAiAnalysis(tryoutId!, attemptId!),
    enabled: !!tryoutId && !!attemptId,
  });
}

export function useTrainerStatus() {
  return useQuery({
    queryKey: queryKeys.trainerStatus,
    queryFn: () => getTrainerStatus(true),
  });
}

export function useTrainerProfile() {
  return useQuery({
    queryKey: queryKeys.trainerProfile,
    queryFn: getTrainerProfile,
  });
}

export function useTrainerCourses() {
  return useQuery({
    queryKey: queryKeys.trainerCourses,
    queryFn: listTrainerCourses,
  });
}

export function useCreateTrainerCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: TrainerCourseCreateRequest) => createTrainerCourse(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.trainerCourses }),
  });
}

export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: getDashboard,
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications,
    queryFn: listNotifications,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.notifications }),
  });
}

export function usePayments() {
  return useQuery({
    queryKey: queryKeys.payments,
    queryFn: listPayments,
  });
}

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreatePaymentRequest) => createPayment(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.payments }),
  });
}

export function useQueryClientInvalidator() {
  const qc = useQueryClient();
  return {
    invalidateStudent: () => qc.invalidateQueries({ queryKey: ["student"] }),
    invalidateAdmin: () => qc.invalidateQueries({ queryKey: ["admin"] }),
    invalidateTrainer: () => qc.invalidateQueries({ queryKey: ["trainer"] }),
    invalidateNotifications: () => qc.invalidateQueries({ queryKey: queryKeys.notifications }),
    invalidatePayments: () => qc.invalidateQueries({ queryKey: queryKeys.payments }),
  };
}
