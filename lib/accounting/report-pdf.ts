import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { ReportPreview } from "@/lib/accounting/reports";

const STATEMENT_IDS = new Set([
  "cash-flows",
  "income-statement",
  "balance-sheet",
]);

function preparedDate(): string {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function isAmountHeader(header: string, key: string): boolean {
  return /amount|revenue|pay|total|due|fee|cost|profit|margin|balance|collected|cash|equity|asset|liabilit/i.test(
    `${header} ${key}`,
  );
}

/** Build and download a PDF for a financial report preview. */
export function downloadReportPdf(report: ReportPreview, filenameBase: string) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "letter",
  });
  const marginX = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text("TalentQuest · Accounting", marginX, 36);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(20);
  doc.text(report.title, marginX, 58);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Prepared ${preparedDate()}`, marginX, 74);

  let cursorY = 92;

  if (report.summary.length > 0) {
    doc.setDrawColor(215, 224, 230);
    doc.line(marginX, cursorY, pageWidth - marginX, cursorY);
    cursorY += 16;

    const colWidth = (pageWidth - marginX * 2) / 2;
    report.summary.forEach((item, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = marginX + col * colWidth;
      const y = cursorY + row * 28;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(item.label.toUpperCase(), x, y);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(20);
      doc.text(item.value, x, y + 14);
    });
    cursorY += Math.ceil(report.summary.length / 2) * 28 + 12;
    doc.setDrawColor(215, 224, 230);
    doc.line(marginX, cursorY, pageWidth - marginX, cursorY);
    cursorY += 14;
  }

  const isStatement = STATEMENT_IDS.has(report.id);
  const navy: [number, number, number] = [11, 58, 83];

  if (isStatement) {
    autoTable(doc, {
      startY: cursorY,
      head: [["Section", "Line item", "Amount"]],
      body: report.rows.map((row) => [
        row.cells.section ?? "",
        row.cells.line ?? "",
        row.cells.amount ?? "",
      ]),
      margin: { left: marginX, right: marginX },
      styles: {
        font: "helvetica",
        fontSize: 9,
        cellPadding: 5,
        textColor: [20, 20, 20],
        lineColor: [215, 224, 230],
        lineWidth: 0.5,
      },
      headStyles: {
        fillColor: navy,
        textColor: 255,
        fontStyle: "bold",
        fontSize: 8,
      },
      alternateRowStyles: { fillColor: [248, 250, 251] },
      columnStyles: {
        0: { cellWidth: 110 },
        1: { cellWidth: "auto" },
        2: { halign: "right", cellWidth: 90 },
      },
    });
  } else {
    const amountIndexes = report.columns
      .map((col, index) =>
        isAmountHeader(col.header, col.key) ? index : -1,
      )
      .filter((index) => index >= 0);

    const columnStyles: Record<number, { halign?: "right" | "left" }> = {};
    for (const index of amountIndexes) {
      columnStyles[index] = { halign: "right" };
    }

    autoTable(doc, {
      startY: cursorY,
      head: [report.columns.map((col) => col.header)],
      body: report.rows.map((row) =>
        report.columns.map((col) => row.cells[col.key] ?? ""),
      ),
      margin: { left: marginX, right: marginX },
      styles: {
        font: "helvetica",
        fontSize: 8,
        cellPadding: 4,
        textColor: [20, 20, 20],
        lineColor: [215, 224, 230],
        lineWidth: 0.5,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: navy,
        textColor: 255,
        fontStyle: "bold",
        fontSize: 8,
      },
      alternateRowStyles: { fillColor: [248, 250, 251] },
      columnStyles,
    });
  }

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(
      "Confidential · For internal accounting use · TalentQuest",
      marginX,
      pageHeight - 28,
    );
    doc.text(`Page ${page} of ${pageCount}`, pageWidth - marginX, pageHeight - 28, {
      align: "right",
    });
  }

  doc.save(`${filenameBase}.pdf`);
}
