import type { ReportPreview } from "@/lib/accounting/reports";

const STATEMENT_IDS = new Set([
  "cash-flows",
  "income-statement",
  "balance-sheet",
]);

function isAmountColumn(header: string, key: string): boolean {
  return /amount|revenue|pay|total|due|fee|cost|profit|margin|balance|collected|cash|equity|asset|liabilit/i.test(
    `${header} ${key}`,
  );
}

function todayLabel(): string {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function StatementBody({ report }: { report: ReportPreview }) {
  const sections: { name: string; rows: typeof report.rows }[] = [];
  for (const row of report.rows) {
    const name = row.cells.section?.trim() || "Detail";
    const last = sections[sections.length - 1];
    if (last && last.name === name) last.rows.push(row);
    else sections.push({ name, rows: [row] });
  }

  return (
    <div className="space-y-8">
      {sections.map((section) => (
        <div key={section.name}>
          <h3 className="border-b border-[var(--cf-ink)] pb-1 text-[11px] font-semibold tracking-[0.14em] text-[var(--cf-ink)] uppercase">
            {section.name}
          </h3>
          <table className="mt-2 w-full border-collapse text-sm">
            <tbody>
              {section.rows.map((row) => {
                const label = row.cells.line ?? "—";
                const amount = row.cells.amount ?? "";
                const isBlank = !amount && !label.trim();
                const isTotal =
                  /total|net |ending|beginning retained|common stock/i.test(
                    label,
                  ) || /total|net /i.test(section.name);
                if (isBlank) {
                  return (
                    <tr key={row.id}>
                      <td colSpan={2} className="h-3" />
                    </tr>
                  );
                }
                return (
                  <tr key={row.id}>
                    <td
                      className={`py-1.5 pr-6 align-baseline ${
                        isTotal
                          ? "font-semibold text-[var(--cf-ink)]"
                          : "text-[var(--cf-ink)]"
                      }`}
                    >
                      {label}
                    </td>
                    <td
                      className={`w-36 py-1.5 text-right align-baseline tabular-nums ${
                        isTotal
                          ? "border-t border-[var(--cf-ink)] pt-2 font-semibold text-[var(--cf-ink)]"
                          : "text-[var(--cf-ink)]"
                      }`}
                    >
                      {amount || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

function TabularBody({ report }: { report: ReportPreview }) {
  const amountKeys = new Set(
    report.columns
      .filter((c) => isAmountColumn(c.header, c.key))
      .map((c) => c.key),
  );

  if (report.rows.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-[var(--cf-muted)]">
        No records are available for this report.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-[var(--cf-ink)]">
            {report.columns.map((col) => (
              <th
                key={col.key}
                className={`px-3 py-2.5 text-[11px] font-semibold tracking-[0.08em] text-[var(--cf-ink)] uppercase ${
                  amountKeys.has(col.key) ? "text-right" : "text-left"
                }`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {report.rows.map((row, index) => (
            <tr
              key={row.id}
              className={`border-b border-[var(--cf-border)] ${
                index % 2 === 1 ? "bg-[var(--cf-surface)]/40" : "bg-white"
              }`}
            >
              {report.columns.map((col) => {
                const value = row.cells[col.key] ?? "—";
                return (
                  <td
                    key={col.key}
                    className={`px-3 py-2.5 text-[var(--cf-ink)] ${
                      amountKeys.has(col.key)
                        ? "text-right tabular-nums"
                        : "text-left"
                    }`}
                  >
                    {value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ReportPreviewView({ report }: { report: ReportPreview }) {
  const isStatement = STATEMENT_IDS.has(report.id);

  return (
    <article className="overflow-hidden rounded-xl border border-[var(--cf-border)] bg-white shadow-sm">
      <header className="border-b border-[var(--cf-border)] bg-[var(--cf-surface)]/50 px-6 py-5 sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.16em] text-[var(--cf-muted)] uppercase">
              TalentQuest · Accounting
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-[var(--cf-ink)] sm:text-2xl">
              {report.title}
            </h2>
          </div>
          <div className="text-right text-xs text-[var(--cf-muted)]">
            <p className="font-medium text-[var(--cf-ink)]">Prepared</p>
            <p className="mt-0.5 tabular-nums">{todayLabel()}</p>
          </div>
        </div>
      </header>

      {report.summary.length > 0 ? (
        <section className="grid gap-0 border-b border-[var(--cf-border)] sm:grid-cols-2 lg:grid-cols-4">
          {report.summary.map((item, index) => (
            <div
              key={item.label}
              className={`px-6 py-4 sm:px-8 ${
                index > 0
                  ? "border-t border-[var(--cf-border)] sm:border-t-0 sm:border-l"
                  : ""
              }`}
            >
              <p className="text-[11px] font-semibold tracking-[0.1em] text-[var(--cf-muted)] uppercase">
                {item.label}
              </p>
              <p className="mt-1.5 text-xl font-semibold tabular-nums text-[var(--cf-ink)]">
                {item.value}
              </p>
            </div>
          ))}
        </section>
      ) : null}

      <section className="px-6 py-6 sm:px-8 sm:py-8">
        {isStatement ? (
          <StatementBody report={report} />
        ) : (
          <TabularBody report={report} />
        )}
      </section>

      <footer className="border-t border-[var(--cf-border)] bg-[var(--cf-surface)]/30 px-6 py-3 text-[11px] text-[var(--cf-muted)] sm:px-8">
        Confidential · For internal accounting use · Figures reflect current
        TalentQuest ledger data
      </footer>
    </article>
  );
}
