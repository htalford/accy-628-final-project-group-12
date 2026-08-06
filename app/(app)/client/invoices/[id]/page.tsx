import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { Table, THead, Th, Td } from "@/components/ui/table";
import { getInvoiceForClient } from "@/lib/client-portal/queries";
import {
  formatMoney,
  invoiceStatusLabel,
  seedStatusTone,
  shortInvoiceNumber,
} from "@/lib/client-portal/labels";
import { InvoicePrintActions } from "./invoice-print-actions";
import { Breadcrumbs } from "@/components/client-portal/breadcrumbs";

export default async function ClientInvoiceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ print?: string }>;
}) {
  const { id } = await params;
  const { print } = await searchParams;
  const invoice = await getInvoiceForClient(id);
  if (!invoice) notFound();

  const lineTotal = invoice.lineItems.reduce((s, l) => s + l.amount, 0);
  const number = shortInvoiceNumber(invoice.id);

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Invoices", href: "/client/invoices" },
          { label: number },
        ]}
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between print:hidden">
        <PageHeader title={`Invoice ${number}`} />
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={seedStatusTone(invoice.status)}>
            {invoiceStatusLabel(invoice.status)}
          </Badge>
          <InvoicePrintActions autoPrint={print === "1" || print === "true"} />
        </div>
      </div>

      <style>{`
        @media print {
          aside,
          [data-client-top-bar],
          .print\\:hidden {
            display: none !important;
          }
          main {
            padding: 0 !important;
            background: white !important;
          }
          body {
            background: white !important;
          }
        }
      `}</style>

      <div className="invoice-print rounded-xl border border-[var(--cf-border)] bg-white p-6 shadow-sm print:border-0 print:shadow-none sm:p-8">
        <div className="mb-8 flex flex-col gap-4 border-b border-[var(--cf-border)] pb-6 sm:flex-row sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-wide text-[var(--cf-muted)] uppercase">
              From
            </p>
            <p className="text-lg font-semibold text-[var(--cf-navy)]">
              TalentQuest
            </p>
            <p className="mt-1 text-sm text-[var(--cf-muted)]">
              Staffing services invoice
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-2xl font-semibold text-[var(--cf-ink)]">
              {number}
            </p>
            <p className="mt-1 text-sm text-[var(--cf-muted)]">
              Status: {invoiceStatusLabel(invoice.status)}
            </p>
            <p className="text-sm text-[var(--cf-muted)]">
              Issued {invoice.created_at.slice(0, 10)}
            </p>
          </div>
        </div>

        <div className="mb-8 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold tracking-wide text-[var(--cf-muted)] uppercase">
              Bill to
            </p>
            <p className="mt-1 font-medium text-[var(--cf-ink)]">
              {invoice.clientName}
            </p>
            {invoice.clientIndustry ? (
              <p className="text-sm text-[var(--cf-muted)]">
                {invoice.clientIndustry}
              </p>
            ) : null}
            {invoice.clientBillingEmail ? (
              <p className="text-sm text-[var(--cf-muted)]">
                {invoice.clientBillingEmail}
              </p>
            ) : null}
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wide text-[var(--cf-muted)] uppercase">
              Billing period
            </p>
            <p className="mt-1 text-sm text-[var(--cf-ink)]">
              {invoice.period_start.slice(0, 10)} –{" "}
              {invoice.period_end.slice(0, 10)}
            </p>
            {invoice.placementLabel ? (
              <p className="mt-3 text-sm text-[var(--cf-muted)]">
                Placement: {invoice.placementLabel}
                {invoice.employeeName ? ` · ${invoice.employeeName}` : ""}
              </p>
            ) : null}
          </div>
        </div>

        <Card className="border-0 p-0 shadow-none">
          <CardTitle className="mb-3 print:text-base">Line items</CardTitle>
          <Table>
            <THead>
              <tr>
                <Th>Description</Th>
                <Th>Qty</Th>
                <Th>Rate</Th>
                <Th>Amount</Th>
              </tr>
            </THead>
            <tbody>
              {invoice.lineItems.map((line) => (
                <tr key={line.id}>
                  <Td>{line.description}</Td>
                  <Td>{line.quantity}</Td>
                  <Td>{formatMoney(line.rate)}</Td>
                  <Td className="font-medium">{formatMoney(line.amount)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
          <div className="mt-4 flex justify-end border-t border-[var(--cf-border)] pt-4">
            <dl className="min-w-[12rem] space-y-1 text-sm">
              <div className="flex justify-between gap-6">
                <dt className="text-[var(--cf-muted)]">Line total</dt>
                <dd>{formatMoney(lineTotal)}</dd>
              </div>
              <div className="flex justify-between gap-6 text-base font-semibold">
                <dt>Amount due</dt>
                <dd>{formatMoney(Number(invoice.amount))}</dd>
              </div>
            </dl>
          </div>
        </Card>

        <p className="mt-8 text-xs text-[var(--cf-muted)] print:mt-12">
          Use your browser&apos;s Print dialog and choose &quot;Save as
          PDF&quot; to download this invoice.
        </p>
      </div>
    </div>
  );
}
