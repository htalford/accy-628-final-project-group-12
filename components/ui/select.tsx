import type { SelectHTMLAttributes } from "react";

export function Select({
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`rounded-lg border border-[var(--cf-border)] bg-white px-3 py-2 text-sm text-[var(--cf-ink)] focus:border-[var(--cf-navy)] focus:ring-2 focus:ring-[var(--cf-navy)]/15 focus:outline-none ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
