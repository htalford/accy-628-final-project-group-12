"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { demoStaffLogin } from "@/app/actions/demo-login";
import { STAFF_EMAIL_DOMAIN } from "@/lib/auth/roles";

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
        setError("Enter a username.");
        return;
      }

      const result = await demoStaffLogin(local, password);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.replace(result.path);
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
            placeholder="any username"
            className="min-w-0 flex-1 px-3 py-2 text-[var(--ot-ink)] outline-none"
          />
          <span className="shrink-0 border-l border-[var(--ot-border)] bg-[var(--ot-mist)] px-3 py-2 text-sm text-[var(--ot-muted)]">
            @{STAFF_EMAIL_DOMAIN}
          </span>
        </div>
        <span className="text-xs text-[var(--ot-muted)]">
          Demo mode: any username and password work. Use accounting for the
          manager portal; otherwise you enter as a recruiter.
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
