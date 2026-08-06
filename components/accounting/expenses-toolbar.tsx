"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { DATE_RANGE_OPTIONS } from "@/lib/accounting/date-range-filter";

export function ExpensesToolbar({
  categories,
}: {
  categories: { value: string; label: string }[];
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

  const selectedCategory = searchParams.get("category") ?? "all";
  const categoryOptions =
    selectedCategory !== "all" &&
    !categories.some((c) => c.value === selectedCategory)
      ? [
          ...categories,
          { value: selectedCategory, label: selectedCategory },
        ].sort((a, b) => a.label.localeCompare(b.label))
      : categories;

  return (
    <div className={`flex flex-wrap gap-3 ${pending ? "opacity-70" : ""}`}>
      <select
        className="rounded-md border border-[var(--cf-border)] bg-white px-3 py-2 text-sm text-[var(--cf-ink)]"
        defaultValue={searchParams.get("range") ?? "all"}
        onChange={(e) => update("range", e.target.value)}
      >
        {DATE_RANGE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <select
        className="rounded-md border border-[var(--cf-border)] bg-white px-3 py-2 text-sm text-[var(--cf-ink)]"
        defaultValue={selectedCategory}
        onChange={(e) => update("category", e.target.value)}
      >
        <option value="all">All categories</option>
        {categoryOptions.map((category) => (
          <option key={category.value} value={category.value}>
            {category.label}
          </option>
        ))}
      </select>
    </div>
  );
}
