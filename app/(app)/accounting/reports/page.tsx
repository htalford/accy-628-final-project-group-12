import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/accounting/panel";
import {
  DRAFTED_STATEMENTS,
  REPORTS,
  reportPreviewHref,
  type ReportDefinition,
} from "@/lib/accounting/reports";

function ReportCards({ reports }: { reports: ReportDefinition[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {reports.map((report) => (
        <Panel
          key={report.id}
          title={report.title}
          action={
            <Button href={reportPreviewHref(report.id)}>Preview</Button>
          }
        >
          {null}
        </Panel>
      ))}
    </div>
  );
}

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Financial Reports" />

      <ReportCards reports={REPORTS} />

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-[var(--cf-ink)]">
          Drafted Financial Statements
        </h2>
        <ReportCards reports={DRAFTED_STATEMENTS} />
      </div>
    </div>
  );
}
