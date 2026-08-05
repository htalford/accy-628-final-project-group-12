export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--cf-border)] bg-white p-4 shadow-sm">
      <p className="text-xs font-medium tracking-wide text-[var(--cf-muted)] uppercase">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-[var(--cf-ink)]">{value}</p>
      {hint ? (
        <p className="mt-1 text-xs text-[var(--cf-muted)]">{hint}</p>
      ) : null}
    </div>
  );
}
