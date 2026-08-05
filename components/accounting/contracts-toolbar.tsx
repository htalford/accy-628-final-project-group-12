"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export function ContractsToolbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") params.delete(key);
    else params.set(key, value);
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  return (
    <div className={`flex flex-wrap gap-3 ${pending ? "opacity-70" : ""}`}>
      <input
        type="search"
        defaultValue={searchParams.get("q") ?? ""}
        placeholder="Search contracts…"
        className="min-w-[12rem] flex-1 rounded-md border border-[var(--cf-border)] bg-white px-3 py-2 text-sm outline-none ring-[var(--cf-accent)] focus:ring-2"
        onChange={(e) => update("q", e.target.value)}
      />
      <select
        className="rounded-md border border-[var(--cf-border)] bg-white px-3 py-2 text-sm"
        defaultValue={searchParams.get("status") ?? "all"}
        onChange={(e) => update("status", e.target.value)}
      >
        <option value="all">All statuses</option>
        <option value="active">Active</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
        <option value="at_risk">At risk</option>
      </select>
    </div>
  );
}
