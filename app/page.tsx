import { redirect } from "next/navigation";
import { getAppUser } from "@/lib/auth/get-app-user";
import { getDashboardPath } from "@/lib/auth/roles";

export default async function HomePage() {
  const user = await getAppUser();
  if (!user) {
    redirect("/login");
  }
  redirect(getDashboardPath(user.role));
}
