import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { ReportPreviewView } from "@/components/accounting/report-preview";
import { ReportExportButton } from "@/components/accounting/report-export-button";
import {
  getReportPreview,
  isReportId,
} from "@/lib/accounting/reports";

export default async function ReportPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isReportId(id)) notFound();

  const report = await getReportPreview(id);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/accounting/reports"
          className="text-sm font-medium text-[var(--cf-ink)] hover:underline"
        >
          ← Back to financial reports
        </Link>
        <PageHeader
          title={report.title}
          actions={<ReportExportButton report={report} />}
        />
      </div>

      <ReportPreviewView report={report} />
    </div>
  );
}
