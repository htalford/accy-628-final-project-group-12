import Link from "next/link";

export function StatCard({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: string;
  hint?: string;
  href?: string;
}) {
  const content = (
    <>
      <p className="text-xs font-medium tracking-wide text-[var(--cf-muted)] uppercase">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-[var(--cf-ink)]">{value}</p>
      {hint ? (
        <p className="mt-1 text-xs text-[var(--cf-muted)]">{hint}</p>
      ) : null}
      {href ? (
        <p className="mt-2 text-xs font-medium text-[var(--cf-accent)]">
          View details →
        </p>
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
    <div className="rounded-xl border border-[var(--cf-border)] bg-white p-4 shadow-sm">
      {content}
    </div>
  );
}
