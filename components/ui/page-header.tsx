export function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--cf-ink)]">
        {title}
      </h1>
      {description ? (
        <p className="mt-1 max-w-2xl text-sm text-[var(--cf-muted)]">
          {description}
        </p>
      ) : null}
    </div>
  );
}
