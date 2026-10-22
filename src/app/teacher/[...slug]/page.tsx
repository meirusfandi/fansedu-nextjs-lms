import { redirect } from "next/navigation";

export default function TeacherRedirectPage() {
  redirect("/login?reason=unsupported");
}
