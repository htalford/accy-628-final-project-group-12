"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getDashboardPath } from "@/lib/auth/roles";
import type { UserRole } from "@/lib/types/database";

const SIGNUP_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "employer", label: "Looking to hire" },
  { value: "candidate", label: "Looking for work" },
];

export function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole | "">("");
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    startTransition(async () => {
      if (role !== "employer" && role !== "candidate") {
        setError("Please choose who you are.");
        return;
      }

      const selectedRole = role;
      const supabase = createClient();

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      // Email confirmation may be required — no session yet.
      if (!signUpData.session) {
        setInfo(
          "Account created. Check your email to confirm, then sign in.",
        );
        return;
      }

      const { data: profile, error: profileError } = await supabase.rpc(
        "complete_signup",
        {
          p_name: name,
          p_role: selectedRole,
          p_company_name:
            selectedRole === "employer" ? companyName || null : null,
        },
      );

      if (profileError || !profile) {
        setError(
          profileError?.message ??
            "Account created, but profile setup failed. Try signing in.",
        );
        return;
      }

      const row = (Array.isArray(profile) ? profile[0] : profile) as {
        role?: UserRole;
      } | null;

      const destinationRole =
        row?.role === "employer" || row?.role === "candidate"
          ? row.role
          : selectedRole;

      router.replace(getDashboardPath(destinationRole));
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-[var(--cf-ink)]">Full name</span>
        <input
          type="text"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-md border border-[var(--cf-border)] bg-white px-3 py-2 text-[var(--cf-ink)] outline-none ring-[var(--cf-accent)] focus:ring-2"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-[var(--cf-ink)]">Email</span>
        <input
          type="email"
          autoComplete="email"
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
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-md border border-[var(--cf-border)] bg-white px-3 py-2 text-[var(--cf-ink)] outline-none ring-[var(--cf-accent)] focus:ring-2"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-[var(--cf-ink)]">I am...</span>
        <select
          required
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole | "")}
          className="rounded-md border border-[var(--cf-border)] bg-white px-3 py-2 text-[var(--cf-ink)] outline-none ring-[var(--cf-accent)] focus:ring-2"
        >
          <option value="" disabled>
            Select one
          </option>
          {SIGNUP_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      {role === "employer" ? (
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-[var(--cf-ink)]">
            Company name
          </span>
          <input
            type="text"
            autoComplete="organization"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Optional"
            className="rounded-md border border-[var(--cf-border)] bg-white px-3 py-2 text-[var(--cf-ink)] outline-none ring-[var(--cf-accent)] focus:ring-2"
          />
        </label>
      ) : null}

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {info ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {info}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 rounded-md bg-[var(--cf-navy)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--cf-navy-hover)] disabled:opacity-60"
      >
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
