import { Search } from "lucide-react";
import type { InputHTMLAttributes } from "react";

export function SearchInput({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={`relative ${className}`}>
      <Search
        className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--cf-muted)]"
        aria-hidden
      />
      <input
        type="search"
        className="w-full rounded-lg border border-[var(--cf-border)] bg-white py-2 pr-3 pl-9 text-sm text-[var(--cf-ink)] placeholder:text-[var(--cf-muted)] focus:border-[var(--cf-navy)] focus:ring-2 focus:ring-[var(--cf-navy)]/15 focus:outline-none"
        {...props}
      />
    </div>
  );
}
