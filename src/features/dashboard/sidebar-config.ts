import type { NavSection } from "@/components/layout/Sidebar";

/** Hanya admin dan trainer. Siswa/guru di-handle di landing. */
export const adminSidebarSections: NavSection[] = [
  { title: "Overview", items: [{ href: "/admin/dashboard", label: "Dashboard" }] },
  {
    title: "Manage",
    items: [
      { href: "/admin/master-data", label: "Master Data" },
      { href: "/admin/users", label: "Users" },
      { href: "/admin/kelas", label: "Kelas" },
      { href: "/admin/tryouts", label: "Tryouts" },
      { href: "/admin/payment", label: "Payment" },
      { href: "/admin/report", label: "Report" },
    ],
  },
];

export const trainerSidebarSections: NavSection[] = [
  { title: "Overview", items: [{ href: "/trainer/dashboard", label: "Dashboard" }] },
  {
    title: "Manage",
    items: [
      { href: "/guru/kelola-siswa", label: "Kelola Siswa" },
      { href: "/guru/kelola-kelas", label: "Kelola Kelas" },
      { href: "/trainer/classes", label: "Kelas Saya" },
      { href: "/trainer/classes/create", label: "Buat Kelas" },
      { href: "/trainer/questions", label: "Bank Soal" },
      { href: "/trainer/quizzes", label: "Kuis" },
    ],
  },
  {
    title: "Lainnya",
    items: [
      { href: "/guru/laporan", label: "Laporan" },
      { href: "/guru/pembayaran", label: "Pembayaran" },
      { href: "/guru/pengaturan", label: "Pengaturan" },
    ],
  },
];
