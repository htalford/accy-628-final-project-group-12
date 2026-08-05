import Link from "next/link";
import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  hint,
  description,
  icon,
  href,
}: {
  label: string;
  value: string;
  hint?: string;
  description?: string;
  icon?: ReactNode;
  href?: string;
}) {
  const subtitle = hint ?? description;

  const content = (
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

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-xl border border-[var(--cf-border)] bg-white p-4 shadow-sm transition hover:border-[var(--cf-accent)] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cf-accent)]"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--cf-border)] bg-white p-4 shadow-sm transition hover:shadow-md">
      {content}
    </div>
  );
}
