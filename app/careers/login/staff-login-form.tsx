"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  DEMO_ACCOUNTS,
  STAFF_EMAIL_DOMAIN,
  getDashboardPath,
  isStaffEmail,
  isStaffRole,
  staffEmailFromUsername,
  staffRoleFromEmail,
} from "@/lib/auth/roles";
import type { UserRole } from "@/lib/types/database";

function demoEmailForUsername(username: string): string | null {
  const role = staffRoleFromEmail(username);
  if (role === "accounting") return DEMO_ACCOUNTS.accounting.email;
  if (role === "recruiter") return DEMO_ACCOUNTS.recruiter.email;
  return null;
}

export function StaffLoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("accounting");
  const [password, setPassword] = useState("DemoPass123!");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const local = username.trim().toLowerCase().split("@")[0] ?? "";
      if (!local) {
        setError("Enter your Talent Quest username.");
        return;
      }

      if (!isStaffEmail(local)) {
        setError(
          "Employee sign in is only for accounting or recruiter emails (for example accounting or recruiter).",
        );
        return;
      }

      const supabase = createClient();
      const staffEmail = staffEmailFromUsername(local);
      let signedInEmail = staffEmail;
      let signInError = (
        await supabase.auth.signInWithPassword({
          email: staffEmail,
          password,
        })
      ).error;

      if (signInError) {
        const demoEmail = demoEmailForUsername(local);
        if (demoEmail) {
          signedInEmail = demoEmail;
          signInError = (
            await supabase.auth.signInWithPassword({
              email: demoEmail,
              password,
            })
          ).error;
        }
      }

      if (signInError) {
        setError(signInError.message);
        return;
      }

      const { data: claimsData } = await supabase.auth.getClaims();
      const authId = claimsData?.claims?.sub;
      if (!authId || typeof authId !== "string") {
        setError("Signed in, but could not read session claims.");
        return;
      }

      const { data: appUser, error: userError } = await supabase
        .from("users")
        .select("role, email")
        .eq("auth_id", authId)
        .maybeSingle();

      if (userError || !appUser) {
        await supabase.auth.signOut();
        setError("No staff profile found for this account.");
        return;
      }

      const role = appUser.role as UserRole;
      const profileEmail = (appUser.email as string | null) ?? signedInEmail;

      if (!isStaffRole(role) || !isStaffEmail(profileEmail)) {
        await supabase.auth.signOut();
        setError(
          "This portal only accepts accounting or recruiter Talent Quest emails. Clients should use Client sign in.",
        );
        return;
      }

      router.replace(getDashboardPath(role));
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-[var(--ot-ink)]">Username</span>
        <div className="flex overflow-hidden rounded-md border border-[var(--ot-border)] bg-white focus-within:ring-2 focus-within:ring-[var(--ot-ocean)]">
          <input
            type="text"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="accounting or recruiter"
            className="min-w-0 flex-1 px-3 py-2 text-[var(--ot-ink)] outline-none"
          />
          <span className="shrink-0 border-l border-[var(--ot-border)] bg-[var(--ot-mist)] px-3 py-2 text-sm text-[var(--ot-muted)]">
            @{STAFF_EMAIL_DOMAIN}
          </span>
        </div>
        <span className="text-xs text-[var(--ot-muted)]">
          Only accounting or recruiter usernames are accepted.
        </span>
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-[var(--ot-ink)]">Password</span>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-md border border-[var(--ot-border)] bg-white px-3 py-2 text-[var(--ot-ink)] outline-none ring-[var(--ot-ocean)] focus:ring-2"
        />
      </label>
      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-1 rounded-md bg-[var(--ot-navy)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--ot-navy-hover)] disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
