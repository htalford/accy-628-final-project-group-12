import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/accounting/panel";
import { StatusBadge, statusTone } from "@/components/ui/status-badge";
import { AuditTrailList } from "@/components/accounting/audit-trail";
import {
  ClientArLink,
  ContractLink,
  EntityLink,
} from "@/components/accounting/entity-links";
import {
  getAuditTrail,
  getInvoiceById,
} from "@/lib/accounting/queries";
import { moneyExact, shortId } from "@/lib/accounting/format";
import {
  buildInvoiceAuditEvent,
  buildPaymentAuditEvent,
  mergeAuditEvents,
} from "@/lib/accounting/audit";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await getInvoiceById(id);
  if (!invoice) notFound();

  const relatedTrail = await getAuditTrail({
    invoiceId: id,
    limit: 40,
  });

  const localTrail = mergeAuditEvents([
    buildInvoiceAuditEvent({
      id: invoice.id,
      clientId: invoice.clientId,
      clientName: invoice.client?.name ?? "Client",
      amount: invoice.amount,
      status: invoice.status,
      periodEnd: invoice.periodEnd,
      createdAt: invoice.createdAt,
      placementId: invoice.placementId,
    }),
    ...invoice.payments.map((p) =>
      buildPaymentAuditEvent({
        id: p.id,
        invoiceId: invoice.id,
        amount: p.amount,
        status: p.status,
        paymentDate: p.paymentDate,
        createdAt: p.createdAt,
      }),
    ),
    ...relatedTrail,
  ]);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link
            href="/accounting/invoices"
            className="text-[var(--cf-accent)] hover:underline"
          >
            ← Back to invoices
          </Link>
          <Link
            href="/accounting/accounts-receivable"
            className="text-[var(--cf-muted)] hover:text-[var(--cf-accent)] hover:underline"
          >
            Accounts receivable
          </Link>
          <Link
            href="/accounting/audit-trail"
            className="text-[var(--cf-muted)] hover:text-[var(--cf-accent)] hover:underline"
          >
            Full audit trail
          </Link>
        </div>
        <PageHeader title={`Invoice ${shortId(invoice.id)}`} />
        <StatusBadge
          label={invoice.displayStatus}
          tone={statusTone(invoice.displayStatus)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Client Information">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--cf-muted)]">Name</dt>
              <dd className="font-medium">
                {invoice.client ? (
                  <ClientArLink
                    clientId={invoice.client.id}
                    name={invoice.client.name}
                  />
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--cf-muted)]">Billing email</dt>
              <dd>{invoice.client?.billing_email ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--cf-muted)]">Industry</dt>
              <dd>{invoice.client?.industry ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--cf-muted)]">Contract</dt>
              <dd>
                {invoice.placementId ? (
                  <ContractLink id={invoice.placementId} />
                ) : (
                  "—"
                )}
              </dd>
            </div>
          </dl>
        </Panel>
        <Panel title="Invoice Summary">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--cf-muted)]">Amount</dt>
              <dd className="font-semibold">{moneyExact(invoice.amount)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--cf-muted)]">Line items total</dt>
              <dd>{moneyExact(invoice.lineBalance.lineSum)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--cf-muted)]">Line balance</dt>
              <dd>
                {invoice.lineBalance.balanced ? (
                  <StatusBadge label="Balanced" tone="success" />
                ) : (
                  <StatusBadge
                    label={`Variance ${moneyExact(invoice.lineBalance.variance)}`}
                    tone="danger"
                  />
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--cf-muted)]">Payments applied</dt>
              <dd>{moneyExact(invoice.paymentsApplied)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--cf-muted)]">Amount due</dt>
              <dd className="font-semibold">
                {moneyExact(
                  Math.max(0, invoice.amount - invoice.paymentsApplied),
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--cf-muted)]">Invoice date</dt>
              <dd>{invoice.invoiceDate}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--cf-muted)]">Due date</dt>
              <dd>{invoice.dueDate}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--cf-muted)]">Status</dt>
              <dd>{invoice.displayStatus}</dd>
            </div>
          </dl>
        </Panel>
      </div>

      <Panel title="Billing Details">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs tracking-wide text-[var(--cf-muted)] uppercase">
              <tr>
                <th className="py-2 pr-4">Description</th>
                <th className="py-2 pr-4">Source</th>
                <th className="py-2 pr-4">Qty</th>
                <th className="py-2 pr-4">Rate</th>
                <th className="py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-[var(--cf-muted)]">
                    No line items.
                  </td>
                </tr>
              ) : (
                invoice.lineItems.map((line) => (
                  <tr key={line.id} className="border-t border-[var(--cf-border)]">
                    <td className="py-2 pr-4">{line.description}</td>
                    <td className="py-2 pr-4">
                      {line.timesheetId ? (
                        <EntityLink
                          href={`/accounting/timesheets/${line.timesheetId}`}
                          mono
                        >
                          TS {shortId(line.timesheetId)}
                        </EntityLink>
                      ) : (
                        <span className="text-[var(--cf-muted)]">—</span>
                      )}
                    </td>
                    <td className="py-2 pr-4">{line.quantity}</td>
                    <td className="py-2 pr-4">{moneyExact(line.rate)}</td>
                    <td className="py-2">{moneyExact(line.amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Payment History">
          {invoice.payments.length === 0 ? (
            <p className="text-sm text-[var(--cf-muted)]">No payments recorded.</p>
          ) : (
            <ul className="divide-y divide-[var(--cf-border)] text-sm">
              {invoice.payments.map((p) => (
                <li key={p.id} className="flex justify-between gap-3 py-2">
                  <span>
                    {p.paymentDate} · {p.status}
                  </span>
                  <span className="font-medium">{moneyExact(p.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel
          title="Audit trail for this invoice"
          action={
            <Link
              href="/accounting/audit-trail"
              className="text-sm font-medium text-[var(--cf-accent)] hover:underline"
            >
              View all →
            </Link>
          }
        >
          <AuditTrailList
            events={localTrail.slice(0, 12)}
            emptyMessage="No related events yet."
          />
        </Panel>
      </div>
    </div>
  );
}
