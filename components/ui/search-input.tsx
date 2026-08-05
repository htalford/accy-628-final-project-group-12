"use client";

import { Search } from "lucide-react";

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="relative block min-w-[12rem] flex-1">
      <Search
        className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--cf-muted)]"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-[var(--cf-border)] bg-white py-2 pr-3 pl-9 text-sm text-[var(--cf-ink)] shadow-sm outline-none transition placeholder:text-[var(--cf-muted)] focus:border-[var(--cf-accent)] focus:ring-2 focus:ring-[var(--cf-accent)]/20"
      />
    </label>
  );
}
