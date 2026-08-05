export function PageHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--cf-ink)]">
        {title}
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-[var(--cf-muted)]">
        {description}
      </p>
    </div>
  );
}
