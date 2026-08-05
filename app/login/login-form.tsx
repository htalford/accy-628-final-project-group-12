"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  clientPortalRoleFromEmail,
  getDashboardPath,
  isClientPortalEmail,
  isClientPortalRole,
} from "@/lib/auth/roles";
import type { UserRole } from "@/lib/types/database";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("employer@talentquest.demo");
  const [password, setPassword] = useState("DemoPass123!");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const trimmedEmail = email.trim().toLowerCase();
      const emailRole = clientPortalRoleFromEmail(trimmedEmail);

      if (!emailRole || !isClientPortalEmail(trimmedEmail)) {
        setError(
          "Client sign in is only for employer or candidate emails (for example employer@… or candidate@…).",
        );
        return;
      }

      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

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
        setError("No application profile found for this account.");
        return;
      }

      const profileEmail = (appUser.email as string | null) ?? trimmedEmail;
      const role = appUser.role as UserRole;
      // Prefer email identity so candidate@… never lands on the employer portal.
      const portalRole =
        clientPortalRoleFromEmail(profileEmail) ??
        (isClientPortalRole(role) ? role : null) ??
        emailRole;

      if (
        !portalRole ||
        !isClientPortalRole(role) ||
        !isClientPortalEmail(profileEmail)
      ) {
        await supabase.auth.signOut();
        setError(
          "This portal only accepts employer or candidate emails. Staff should use Employee sign in.",
        );
        return;
      }

      router.replace(getDashboardPath(portalRole));
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-[var(--cf-ink)]">Email</span>
        <input
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="employer@… or candidate@…"
          className="rounded-md border border-[var(--cf-border)] bg-white px-3 py-2 text-[var(--cf-ink)] outline-none ring-[var(--cf-accent)] focus:ring-2"
        />
        <span className="text-xs text-[var(--cf-muted)]">
          Only employer or candidate emails are accepted.
        </span>
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-[var(--cf-ink)]">Password</span>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-md border border-[var(--cf-border)] bg-white px-3 py-2 text-[var(--cf-ink)] outline-none ring-[var(--cf-accent)] focus:ring-2"
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
        className="mt-1 rounded-md bg-[var(--cf-navy)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--cf-navy-hover)] disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
