import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  const role = cookieStore.get("auth_role")?.value;

  if (token && role) {
    if (role === "admin") redirect("/admin/dashboard");
    if (role === "trainer") redirect("/trainer/dashboard");
    redirect("/landing");
  }

  redirect("/login");
}
