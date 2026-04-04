import { redirect } from "next/navigation";

/** Rute lama — manajemen kelas & modul dipisah di `/admin/master-data/kelas`. */
export default function LegacyMasterDataSubjectRedirect() {
  redirect("/admin/master-data/kelas");
}
