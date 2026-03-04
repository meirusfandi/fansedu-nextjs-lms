import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default function Home() {
  const cookieStore = cookies();
  const token = cookieStore.get("auth_token")?.value;
  const role = cookieStore.get("auth_role")?.value;

  if (token) {
    redirect(role === "admin" ? "/admin" : "/student");
  }

  redirect("/login");
}
