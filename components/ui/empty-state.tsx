export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--cf-border)] bg-white px-6 py-10 text-center">
      <p className="text-sm font-semibold text-[var(--cf-ink)]">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-[var(--cf-muted)]">
        {description}
      </p>
    </div>
  );
}
