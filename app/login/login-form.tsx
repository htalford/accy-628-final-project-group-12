"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getDashboardPath } from "@/lib/auth/roles";
import type { UserRole } from "@/lib/types/database";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("candidate@contractflow.demo");
  const [password, setPassword] = useState("DemoPass123!");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
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
        .select("role")
        .eq("auth_id", authId)
        .maybeSingle();

      if (userError || !appUser) {
        setError("No application profile found for this account.");
        return;
      }

      router.replace(getDashboardPath(appUser.role as UserRole));
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
          className="rounded-md border border-[var(--cf-border)] bg-white px-3 py-2 text-[var(--cf-ink)] outline-none ring-[var(--cf-accent)] focus:ring-2"
        />
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
