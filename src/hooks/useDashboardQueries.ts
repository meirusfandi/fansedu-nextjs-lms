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
  adminListPayments,
  adminGetPayment,
  adminConfirmPayment,
  adminRejectPayment,
  adminCreatePayment,
  adminCreateManualOrder,
  adminUploadOrderPaymentProof,
  adminVerifyOrder,
  adminPatchOrderPurchaseMeta,
  adminGrantEnrollment,
  adminUpdateEnrollment,
  adminUpdatePayment,
  adminListUsers,
  adminListCourses,
  trainerListPayments,
  getMySubscription,
  aiCreateSubscription,
} from "@/lib/api";
import type {
  TrainerCourseCreateRequest,
  Course,
  Payment,
  CreatePaymentRequest,
  AdminCreatePaymentRequest,
  CreateSubscriptionRequest,
  AdminGrantEnrollmentRequest,
  AdminManualOrderCreateRequest,
  AdminOrderPurchaseMetaPatchRequest,
  AdminUpdateEnrollmentRequest,
  AdminVerifyOrderRequest,
  AdminUpdatePaymentRequest,
  User,
} from "@/lib/api-types";

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
  adminPayments: ["admin", "payments"] as const,
  adminPaymentDetail: (id: string) => ["admin", "payment", id] as const,
  trainerPayments: ["trainer", "payments"] as const,
  trainerAiSubscription: ["trainer", "ai-subscription"] as const,
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

/** Semua pembayaran untuk verifikasi admin. GET /admin/payments */
export function useAdminPayments() {
  return useQuery({
    queryKey: queryKeys.adminPayments,
    queryFn: adminListPayments,
    staleTime: 30_000,
  });
}

/**
 * Detail satu pembayaran: GET /admin/payments/:id bila tersedia, lalu fallback ke pencarian di daftar.
 * Menghindari "tidak ditemukan" saat membuka link detail dari notifikasi atau cache daftar kedaluwarsa.
 */
export function useAdminPaymentDetail(paymentId: string | undefined) {
  const id = String(paymentId ?? "").trim();
  return useQuery({
    queryKey: queryKeys.adminPaymentDetail(id || "_"),
    queryFn: async (): Promise<Payment | null> => {
      if (!id) return null;
      const direct = await adminGetPayment(id);
      if (direct) return direct;
      const all = await adminListPayments();
      return all.find((p) => String(p.id) === id) ?? null;
    },
    enabled: id.length > 0,
  });
}

/** Riwayat pembayaran trainer: GET /trainer/payments, fallback GET /payments. */
export function useTrainerPayments() {
  return useQuery({
    queryKey: queryKeys.trainerPayments,
    queryFn: async () => {
      const fromTrainer = await trainerListPayments();
      if (fromTrainer.length > 0) return fromTrainer;
      return listPayments();
    },
  });
}

/** Langganan AI (GET /subscription) untuk akun trainer yang sedang login. */
export function useMyAiSubscription() {
  return useQuery({
    queryKey: queryKeys.trainerAiSubscription,
    queryFn: getMySubscription,
    staleTime: 60_000,
  });
}

/** Aktivasi / perpanjang langganan AI (POST /subscription). */
export function useCreateAiSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateSubscriptionRequest) => aiCreateSubscription(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.trainerAiSubscription });
    },
  });
}

export function useAdminConfirmPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (paymentId: string) => adminConfirmPayment(paymentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.adminPayments });
      qc.invalidateQueries({ queryKey: ["admin", "payment"] });
      qc.invalidateQueries({ queryKey: queryKeys.payments });
      qc.invalidateQueries({ queryKey: queryKeys.trainerPayments });
      qc.invalidateQueries({ queryKey: queryKeys.trainerStatus });
      qc.invalidateQueries({ queryKey: queryKeys.studentDashboard });
      qc.invalidateQueries({ queryKey: queryKeys.studentCourses });
      qc.invalidateQueries({ queryKey: queryKeys.studentCoursesBySubject });
      qc.invalidateQueries({ queryKey: queryKeys.studentPayments });
    },
  });
}

export function useAdminRejectPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ paymentId, reason }: { paymentId: string; reason?: string }) =>
      adminRejectPayment(paymentId, reason ? { reason } : undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.adminPayments });
      qc.invalidateQueries({ queryKey: ["admin", "payment"] });
      qc.invalidateQueries({ queryKey: queryKeys.payments });
      qc.invalidateQueries({ queryKey: queryKeys.trainerPayments });
      qc.invalidateQueries({ queryKey: queryKeys.trainerStatus });
      qc.invalidateQueries({ queryKey: queryKeys.studentPayments });
    },
  });
}

/** Catat pembayaran atas nama siswa/user. */
export function useAdminCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AdminCreatePaymentRequest) => adminCreatePayment(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.adminPayments });
      qc.invalidateQueries({ queryKey: ["admin", "payment"] });
      qc.invalidateQueries({ queryKey: queryKeys.payments });
      qc.invalidateQueries({ queryKey: queryKeys.trainerPayments });
      qc.invalidateQueries({ queryKey: queryKeys.trainerStatus });
      qc.invalidateQueries({ queryKey: queryKeys.studentPayments });
    },
  });
}

/** Ubah tanggal pembelian / catatan. */
export function useAdminUpdatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ paymentId, body }: { paymentId: string; body: AdminUpdatePaymentRequest }) =>
      adminUpdatePayment(paymentId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.adminPayments });
      qc.invalidateQueries({ queryKey: ["admin", "payment"] });
      qc.invalidateQueries({ queryKey: queryKeys.payments });
      qc.invalidateQueries({ queryKey: queryKeys.trainerPayments });
      qc.invalidateQueries({ queryKey: queryKeys.trainerStatus });
      qc.invalidateQueries({ queryKey: queryKeys.studentPayments });
    },
  });
}

export function useAdminCreateManualOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AdminManualOrderCreateRequest) => adminCreateManualOrder(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.adminPayments });
      qc.invalidateQueries({ queryKey: ["admin", "payment"] });
    },
  });
}

export function useAdminUploadOrderPaymentProof() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      proofFile,
      senderAccountNo,
      senderName,
    }: {
      orderId: string;
      proofFile: File;
      senderAccountNo?: string;
      senderName?: string;
    }) => adminUploadOrderPaymentProof(orderId, proofFile, { senderAccountNo, senderName }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.adminPayments });
      qc.invalidateQueries({ queryKey: ["admin", "payment"] });
    },
  });
}

export function useAdminVerifyOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, body }: { orderId: string; body?: AdminVerifyOrderRequest }) =>
      adminVerifyOrder(orderId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.adminPayments });
      qc.invalidateQueries({ queryKey: ["admin", "payment"] });
      qc.invalidateQueries({ queryKey: queryKeys.payments });
      qc.invalidateQueries({ queryKey: queryKeys.studentPayments });
      qc.invalidateQueries({ queryKey: queryKeys.trainerPayments });
      qc.invalidateQueries({ queryKey: queryKeys.studentDashboard });
      qc.invalidateQueries({ queryKey: queryKeys.studentCourses });
      qc.invalidateQueries({ queryKey: queryKeys.studentCoursesBySubject });
    },
  });
}

export function useAdminPatchOrderPurchaseMeta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, body }: { orderId: string; body: AdminOrderPurchaseMetaPatchRequest }) =>
      adminPatchOrderPurchaseMeta(orderId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.adminPayments });
      qc.invalidateQueries({ queryKey: ["admin", "payment"] });
      qc.invalidateQueries({ queryKey: queryKeys.studentPayments });
    },
  });
}

export function useAdminGrantEnrollment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AdminGrantEnrollmentRequest) => adminGrantEnrollment(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "courses"] });
      qc.invalidateQueries({ queryKey: queryKeys.studentCourses });
    },
  });
}

export function useAdminUpdateEnrollment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ enrollmentId, body }: { enrollmentId: string; body: AdminUpdateEnrollmentRequest }) =>
      adminUpdateEnrollment(enrollmentId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "courses"] });
      qc.invalidateQueries({ queryKey: queryKeys.studentCourses });
    },
  });
}

/** Muat user admin untuk modal pembayaran. */
export function useAdminUsersForPaymentModal(enabled: boolean) {
  return useQuery<User[], Error>({
    queryKey: ["admin", "users", "payment-modal"],
    queryFn: () => adminListUsers(),
    enabled,
    staleTime: 30_000,
  });
}

/** Muat daftar kelas untuk referensi pembayaran kelas. */
export function useAdminCoursesForPaymentModal(enabled: boolean) {
  return useQuery<Course[], Error>({
    queryKey: ["admin", "courses", "payment-modal"],
    queryFn: () => adminListCourses(),
    enabled,
    staleTime: 30_000,
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
    invalidateAdminPayments: () => qc.invalidateQueries({ queryKey: queryKeys.adminPayments }),
  };
}
