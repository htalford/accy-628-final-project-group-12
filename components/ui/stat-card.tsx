import Link from "next/link";
import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  hint,
  description,
  icon,
  href,
  compact = false,
}: {
  label: string;
  value: string;
  hint?: string;
  description?: string;
  icon?: ReactNode;
  href?: string;
  compact?: boolean;
}) {
  const subtitle = hint ?? description;

  const content = compact ? (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
      <p className="text-xs font-medium leading-tight tracking-wide text-[var(--cf-muted)] uppercase">
        {label}
      </p>
      <p className="text-2xl font-semibold leading-none text-[var(--cf-ink)] sm:text-3xl">
        {value}
      </p>
    </div>
  ) : (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium tracking-wide text-[var(--cf-muted)] uppercase">
          {label}
        </p>
        {icon ? (
          <div className="rounded-lg bg-[var(--cf-accent)]/10 p-2 text-[var(--cf-accent)]">
            {icon}
          </div>
        ) : null}
      </div>
      <p className="mt-2 text-2xl font-semibold text-[var(--cf-ink)]">{value}</p>
      {subtitle ? (
        <p className="mt-1 text-xs text-[var(--cf-muted)]">{subtitle}</p>
      ) : null}
    </>
  );

  const className = compact
    ? "aspect-square w-full rounded-xl border border-[var(--cf-border)] bg-white shadow-sm transition hover:border-[var(--cf-accent)] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cf-accent)]"
    : "rounded-xl border border-[var(--cf-border)] bg-white p-4 shadow-sm transition hover:border-[var(--cf-accent)] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cf-accent)]";

  if (href) {
    return (
      <Link href={href} className={`block ${className}`} title={subtitle}>
        {content}
      </Link>
    );
  }

  return (
    <div className={className} title={subtitle}>
      {content}
    </div>
  );
}
