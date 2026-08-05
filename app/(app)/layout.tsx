import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getAppUser } from "@/lib/auth/get-app-user";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAppUser();
  if (!user) {
    redirect("/login");
  }

  return <AppShell user={user}>{children}</AppShell>;
}
