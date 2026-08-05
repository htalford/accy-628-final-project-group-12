"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DEMO_ACCOUNTS, getDashboardPath } from "@/lib/auth/roles";
import type { UserRole } from "@/lib/types/database";

export async function switchDemoRole(role: UserRole) {
  const password = process.env.DEMO_PASSWORD;
  if (!password) {
    throw new Error("DEMO_PASSWORD is not configured");
  }

  const account = DEMO_ACCOUNTS[role];
  const supabase = await createClient();

  await supabase.auth.signOut();

  const { error } = await supabase.auth.signInWithPassword({
    email: account.email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  redirect(getDashboardPath(role));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
