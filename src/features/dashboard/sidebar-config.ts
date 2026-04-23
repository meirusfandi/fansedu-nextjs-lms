import type { NavSection } from "@/components/layout/Sidebar";

/** Hanya admin dan trainer (app ini tidak untuk siswa). */
export const adminSidebarSections: NavSection[] = [
  { title: "Overview", items: [{ href: "/admin/dashboard", label: "Dashboard" }] },
  {
    title: "Manage",
    items: [
      { href: "/admin/users", label: "Users" },
      { href: "/admin/kelas", label: "Kelas" },
      { href: "/admin/tryouts", label: "Tryouts" },
      { href: "/admin/question-bank", label: "Bank soal" },
      { href: "/admin/vouchers", label: "Voucher" },
      { href: "/admin/payment", label: "Payment" },
      { href: "/admin/landing-packages", label: "Paket landing" },
      { href: "/admin/report", label: "Report" },
    ],
  },
  {
    title: "Master Data",
    items: [
      { href: "/admin/master-data/setting", label: "Setting" },
      { href: "/admin/master-data/role", label: "Role" },
      { href: "/admin/master-data/kelas", label: "Bidang" },
      { href: "/admin/master-data/sekolah", label: "Sekolah" },
      { href: "/admin/master-data/jenjang", label: "Jenjang Pendidikan" },
      { href: "/admin/master-data/event", label: "Event" },
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
      { href: "/trainer/tryouts", label: "Tryouts" },
    ],
  },
  {
    title: "Lainnya",
    items: [
      { href: "/guru/laporan", label: "Laporan" },
      { href: "/guru/pembayaran", label: "Pembayaran" },
      { href: "/guru/berlangganan-ai", label: "Berlangganan AI" },
      { href: "/guru/pengaturan", label: "Pengaturan" },
    ],
  },
];
