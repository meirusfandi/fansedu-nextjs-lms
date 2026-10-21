import { redirect } from "next/navigation";

export default function TeacherRedirectPage() {
  // Arahkan ke dashboard guru terintegrasi FansEdu
  redirect("/guru");
}
