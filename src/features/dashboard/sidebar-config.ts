import type { NavSection } from "@/components/layout/Sidebar";

/** Hanya admin dan trainer (app ini tidak untuk siswa). */
export const adminSidebarSections: NavSection[] = [
  { title: "Ringkasan", items: [{ href: "/admin/dashboard", label: "Dashboard" }] },
  {
    title: "Kelola",
    items: [
      { href: "/admin/users", label: "Pengguna" },
      { href: "/admin/kelas", label: "Kelas & materi" },
      { href: "/admin/tryouts", label: "Event / tryout" },
      { href: "/admin/question-bank", label: "Bank soal" },
      { href: "/admin/vouchers", label: "Voucher" },
      { href: "/admin/payment", label: "Pembayaran" },
      { href: "/admin/landing-packages", label: "Paket landing" },
      { href: "/admin/report", label: "Laporan" },
    ],
  },
  {
    title: "Master data",
    items: [
      { href: "/admin/master-data/setting", label: "Pengaturan" },
      { href: "/admin/master-data/role", label: "Role" },
      { href: "/admin/master-data/kelas", label: "Bidang (mapel)" },
      { href: "/admin/master-data/sekolah", label: "Sekolah" },
      { href: "/admin/master-data/jenjang", label: "Jenjang pendidikan" },
      { href: "/admin/master-data/event", label: "Event" },
    ],
  },
];

export const trainerSidebarSections: NavSection[] = [
  { title: "Ringkasan", items: [{ href: "/trainer/dashboard", label: "Dashboard" }] },
  {
    title: "Kelola",
    items: [
      { href: "/guru/kelola-siswa", label: "Kelola siswa" },
      { href: "/guru/kelola-kelas", label: "Kelola kelas" },
      { href: "/trainer/classes", label: "Kelas saya" },
      { href: "/trainer/classes/create", label: "Buat kelas" },
      { href: "/trainer/questions", label: "Bank soal" },
      { href: "/trainer/tryouts", label: "Tryout / event" },
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
