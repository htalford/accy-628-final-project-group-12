"use server";

import { createClient } from "@/lib/supabase/server";
import {
  DEMO_ACCOUNTS,
  clientPortalRoleFromEmail,
  getDashboardPath,
  staffRoleFromEmail,
} from "@/lib/auth/roles";
import type { UserRole } from "@/lib/types/database";

async function signInDemoAccount(role: UserRole) {
  const password = process.env.DEMO_PASSWORD;
  if (!password) {
    return { ok: false as const, error: "DEMO_PASSWORD is not configured" };
  }

  const account = DEMO_ACCOUNTS[role];
  const supabase = await createClient();

  await supabase.auth.signOut();

  const { error } = await supabase.auth.signInWithPassword({
    email: account.email,
    password,
  });

  if (error) {
    return { ok: false as const, error: error.message };
  }

  return { ok: true as const, path: getDashboardPath(role) };
}

/** Client portal: any email/password signs into employer or candidate demo. */
export async function demoClientLogin(email: string, _password: string) {
  const role = clientPortalRoleFromEmail(email) ?? "employer";
  return signInDemoAccount(role);
}

/** Staff portal: any username/password signs into accounting or recruiter demo. */
export async function demoStaffLogin(username: string, _password: string) {
  const role = staffRoleFromEmail(username) ?? "recruiter";
  return signInDemoAccount(role);
}
