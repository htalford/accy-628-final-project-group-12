"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";

export function InvoicesToolbar({
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
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className={`flex flex-wrap gap-3 ${pending ? "opacity-70" : ""}`}>
      <input
        type="search"
        defaultValue={searchParams.get("q") ?? ""}
        placeholder="Search invoices…"
        className="min-w-[12rem] flex-1 rounded-md border border-[var(--cf-border)] bg-white px-3 py-2 text-sm outline-none ring-[var(--cf-accent)] focus:ring-2"
        onChange={(e) => update("q", e.target.value)}
      />
      <select
        className="rounded-md border border-[var(--cf-border)] bg-white px-3 py-2 text-sm"
        defaultValue={searchParams.get("status") ?? "all"}
        onChange={(e) => update("status", e.target.value)}
      >
        <option value="all">All statuses</option>
        <option value="draft">Draft</option>
        <option value="sent">Sent</option>
        <option value="paid">Paid</option>
        <option value="partial">Partially Paid</option>
        <option value="overdue">Overdue</option>
        <option value="disputed">Disputed</option>
      </select>
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
    </div>
  );
}
