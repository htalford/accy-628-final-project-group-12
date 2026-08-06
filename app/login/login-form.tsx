"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { demoClientLogin } from "@/app/actions/demo-login";

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
      const result = await demoClientLogin(email.trim(), password);
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
        <span className="font-medium text-[var(--cf-ink)]">Email</span>
        <input
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="any email"
          className="rounded-md border border-[var(--cf-border)] bg-white px-3 py-2 text-[var(--cf-ink)] outline-none ring-[var(--cf-accent)] focus:ring-2"
        />
        <span className="text-xs text-[var(--cf-muted)]">
          Demo mode: any email and password work. Use candidate@… for the
          candidate portal; otherwise you enter as an employer.
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
