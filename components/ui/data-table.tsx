import Link from "next/link";

export type Column<T> = {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => React.ReactNode;
};

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  rowHref,
  emptyTitle = "No records",
  emptyDescription = "Nothing to show yet.",
}: {
  columns: Column<T>[];
  rows: T[];
  rowHref?: (row: T) => string;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--cf-border)] bg-white px-6 py-10 text-center">
        <p className="text-sm font-medium text-[var(--cf-ink)]">{emptyTitle}</p>
        <p className="mt-1 text-sm text-[var(--cf-muted)]">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--cf-border)] bg-white shadow-sm">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-[var(--cf-border)] bg-[var(--cf-surface)] text-xs tracking-wide text-[var(--cf-muted)] uppercase">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={`px-4 py-3 font-medium ${col.className ?? ""}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const href = rowHref?.(row);
            const cells = columns.map((col) => (
              <td key={col.key} className={`px-4 py-3 text-[var(--cf-ink)] ${col.className ?? ""}`}>
                {col.render(row)}
              </td>
            ));
            if (href) {
              return (
                <tr
                  key={row.id}
                  className="border-b border-[var(--cf-border)] last:border-0 hover:bg-[var(--cf-surface)]/70"
                >
                  {columns.map((col, i) => (
                    <td key={col.key} className={`px-4 py-3 ${col.className ?? ""}`}>
                      <Link href={href} className="block text-[var(--cf-ink)]">
                        {col.render(row)}
                      </Link>
                    </td>
                  ))}
                </tr>
              );
            }
            return (
              <tr
                key={row.id}
                className="border-b border-[var(--cf-border)] last:border-0"
              >
                {cells}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
