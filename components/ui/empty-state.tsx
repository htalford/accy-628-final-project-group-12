export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--cf-border)] bg-white px-6 py-10 text-center">
      <p className="text-sm font-semibold text-[var(--cf-ink)]">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-[var(--cf-muted)]">
        {description}
      </p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
