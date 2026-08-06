"use client";

import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { ReportPreview } from "@/lib/accounting/reports";

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function buildCsv(report: ReportPreview): string {
  const headers = report.columns.map((c) => escapeCsv(c.header)).join(",");
  const lines = report.rows.map((row) =>
    report.columns
      .map((c) => escapeCsv(row.cells[c.key] ?? ""))
      .join(","),
  );
  return [headers, ...lines].join("\r\n");
}

/** Excel-friendly CSV (UTF-8 BOM). Opens in Excel, Google Sheets, Numbers. */
function buildExcelCsv(report: ReportPreview): string {
  return `\uFEFF${buildCsv(report)}`;
}

/** SpreadsheetML XML — opens in Excel (.xls) without extra libraries. */
function buildExcelXml(report: ReportPreview): string {
  const escapeXml = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const headerCells = report.columns
    .map(
      (c) =>
        `<Cell><Data ss:Type="String">${escapeXml(c.header)}</Data></Cell>`,
    )
    .join("");

  const bodyRows = report.rows
    .map((row) => {
      const cells = report.columns
        .map((c) => {
          const raw = row.cells[c.key] ?? "";
          const asNumber = raw.replace(/[$,%\s]/g, "");
          const numeric =
            asNumber !== "" &&
            !Number.isNaN(Number(asNumber)) &&
            /^-?[\d.]+$/.test(asNumber);
          if (numeric) {
            return `<Cell><Data ss:Type="Number">${escapeXml(asNumber)}</Data></Cell>`;
          }
          return `<Cell><Data ss:Type="String">${escapeXml(raw)}</Data></Cell>`;
        })
        .join("");
      return `<Row>${cells}</Row>`;
    })
    .join("");

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="${escapeXml(report.title.slice(0, 31))}">
  <Table>
   <Row>${headerCells}</Row>
   ${bodyRows}
  </Table>
 </Worksheet>
</Workbook>`;
}

function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function ReportExportButton({ report }: { report: ReportPreview }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const base = useMemo(() => slugify(report.title) || "report", [report.title]);

  async function exportAs(format: "pdf" | "csv" | "excel-csv" | "excel-xml") {
    if (format === "pdf") {
      const { downloadReportPdf } = await import("@/lib/accounting/report-pdf");
      downloadReportPdf(report, base);
    } else if (format === "csv") {
      downloadBlob(
        `${base}.csv`,
        buildCsv(report),
        "text/csv;charset=utf-8",
      );
    } else if (format === "excel-csv") {
      downloadBlob(
        `${base}-excel.csv`,
        buildExcelCsv(report),
        "text/csv;charset=utf-8",
      );
    } else {
      downloadBlob(
        `${base}.xls`,
        buildExcelXml(report),
        "application/vnd.ms-excel",
      );
    }
    setOpen(false);
  }

  return (
    <div className="relative" ref={rootRef}>
      <Button
        type="button"
        variant="secondary"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        Export
      </Button>
      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10 cursor-default"
            aria-label="Close export menu"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="absolute right-0 z-20 mt-1 min-w-[220px] rounded-md border border-[var(--cf-border)] bg-white py-1 shadow-md"
          >
            <button
              type="button"
              role="menuitem"
              className="block w-full px-3 py-2 text-left text-sm text-[var(--cf-ink)] hover:bg-[var(--cf-surface)]"
              onClick={() => exportAs("pdf")}
            >
              PDF (.pdf)
            </button>
            <button
              type="button"
              role="menuitem"
              className="block w-full px-3 py-2 text-left text-sm text-[var(--cf-ink)] hover:bg-[var(--cf-surface)]"
              onClick={() => exportAs("csv")}
            >
              CSV (.csv)
            </button>
            <button
              type="button"
              role="menuitem"
              className="block w-full px-3 py-2 text-left text-sm text-[var(--cf-ink)] hover:bg-[var(--cf-surface)]"
              onClick={() => exportAs("excel-csv")}
            >
              Excel CSV (.csv)
            </button>
            <button
              type="button"
              role="menuitem"
              className="block w-full px-3 py-2 text-left text-sm text-[var(--cf-ink)] hover:bg-[var(--cf-surface)]"
              onClick={() => exportAs("excel-xml")}
            >
              Excel Spreadsheet (.xls)
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
