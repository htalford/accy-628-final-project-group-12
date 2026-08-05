"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export function ReportsFilters({
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
        type="date"
        className="rounded-md border border-[var(--cf-border)] bg-white px-3 py-2 text-sm"
        defaultValue={searchParams.get("from") ?? ""}
        onChange={(e) => update("from", e.target.value)}
        aria-label="From date"
      />
      <input
        type="date"
        className="rounded-md border border-[var(--cf-border)] bg-white px-3 py-2 text-sm"
        defaultValue={searchParams.get("to") ?? ""}
        onChange={(e) => update("to", e.target.value)}
        aria-label="To date"
      />
      <select
        className="rounded-md border border-[var(--cf-border)] bg-white px-3 py-2 text-sm"
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
        className="rounded-md border border-[var(--cf-border)] bg-white px-3 py-2 text-sm"
        defaultValue={searchParams.get("recruiter") ?? "all"}
        onChange={(e) => update("recruiter", e.target.value)}
      >
        <option value="all">All recruiters</option>
        <option value="morgan">Morgan Recruiter</option>
      </select>
    </div>
  );
}
