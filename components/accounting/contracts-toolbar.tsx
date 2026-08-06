"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export function ContractsToolbar({
  clients,
}: {
  clients: { id: string; name: string }[];
}) {
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
        placeholder="Search contracts..."
        className="min-w-[12rem] flex-1 rounded-md border border-[var(--cf-border)] bg-white px-3 py-2 text-sm text-[var(--cf-ink)] outline-none ring-[var(--cf-accent)] placeholder:text-[var(--cf-muted)] focus:ring-2"
        onChange={(e) => update("q", e.target.value)}
      />
      <select
        className="rounded-md border border-[var(--cf-border)] bg-white px-3 py-2 text-sm text-[var(--cf-ink)]"
        defaultValue={searchParams.get("client") ?? "all"}
        onChange={(e) => update("client", e.target.value)}
      >
        <option value="all">All clients</option>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <select
        className="rounded-md border border-[var(--cf-border)] bg-white px-3 py-2 text-sm text-[var(--cf-ink)]"
        defaultValue={searchParams.get("status") ?? "all"}
        onChange={(e) => update("status", e.target.value)}
      >
        <option value="all">All statuses</option>
        <option value="active">Active</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
        <option value="at_risk">At risk</option>
      </select>
      <select
        className="rounded-md border border-[var(--cf-border)] bg-white px-3 py-2 text-sm text-[var(--cf-ink)]"
        defaultValue={searchParams.get("type") ?? "all"}
        onChange={(e) => update("type", e.target.value)}
      >
        <option value="all">All types</option>
        <option value="permanent">Permanent</option>
        <option value="temp">Temporary</option>
      </select>
    </div>
  );
}
