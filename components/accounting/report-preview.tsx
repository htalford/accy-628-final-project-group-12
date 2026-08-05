import { DataTable } from "@/components/ui/data-table";
import { Panel } from "@/components/accounting/panel";
import type { ReportPreview } from "@/lib/accounting/reports";

export function ReportPreviewView({ report }: { report: ReportPreview }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {report.summary.map((item) => (
          <Panel key={item.label} title={item.label}>
            <p className="text-2xl font-semibold text-[var(--cf-ink)]">
              {item.value}
            </p>
          </Panel>
        ))}
      </div>

      <Panel title="Preview" description={report.description}>
        <DataTable
          rows={report.rows}
          emptyTitle="No rows for this report"
          emptyDescription="No matching records are available yet."
          columns={report.columns.map((col) => ({
            key: col.key,
            header: col.header,
            render: (row: (typeof report.rows)[number]) =>
              row.cells[col.key] ?? "—",
          }))}
        />
      </Panel>
    </div>
  );
}
