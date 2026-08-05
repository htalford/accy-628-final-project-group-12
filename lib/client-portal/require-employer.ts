import "server-only";

import { redirect } from "next/navigation";
import { getAppUser } from "@/lib/auth/get-app-user";
import type { AppUser } from "@/lib/types/database";

/** Require employer session with linked client (Client Portal only). */
export async function requireEmployerUser(): Promise<AppUser> {
  const user = await getAppUser();
  if (!user) redirect("/login");
  if (user.role !== "employer" || !user.linked_client_id) {
    redirect("/");
  }
  return user;
}
