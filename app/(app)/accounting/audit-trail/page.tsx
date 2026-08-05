import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/accounting/panel";
import { AuditTrailList } from "@/components/accounting/audit-trail";
import { getAuditTrail, getClients } from "@/lib/accounting/queries";

export default async function AuditTrailPage({
  searchParams,
}: {
  searchParams: Promise<{
    client?: string;
    type?: string;
  }>;
}) {
  const params = await searchParams;
  const [clients, events] = await Promise.all([
    getClients(),
    getAuditTrail({
      clientId: params.client && params.client !== "all" ? params.client : undefined,
      limit: 150,
    }),
  ]);

  const filtered =
    params.type && params.type !== "all"
      ? events.filter((e) => e.type === params.type)
      : events;

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Trail" />

      <form className="flex flex-wrap gap-3 rounded-xl border border-[var(--cf-border)] bg-white p-3 shadow-sm">
        <label className="flex flex-col gap-1 text-xs font-medium text-[var(--cf-muted)]">
          Client
          <select
            name="client"
            defaultValue={params.client ?? "all"}
            className="rounded-md border border-[var(--cf-border)] bg-white px-2 py-1.5 text-sm text-[var(--cf-ink)]"
          >
            <option value="all">All clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-[var(--cf-muted)]">
          Event type
          <select
            name="type"
            defaultValue={params.type ?? "all"}
            className="rounded-md border border-[var(--cf-border)] bg-white px-2 py-1.5 text-sm text-[var(--cf-ink)]"
          >
            <option value="all">All types</option>
            <option value="invoice">Invoices</option>
            <option value="payment">Payments</option>
            <option value="timesheet">Timesheets</option>
            <option value="expense">Expenses</option>
            <option value="contract">Contracts</option>
          </select>
        </label>
        <div className="flex items-end">
          <button
            type="submit"
            className="rounded-md bg-[var(--cf-accent)] px-3 py-1.5 text-sm font-medium text-white"
          >
            Filter
          </button>
        </div>
        {(params.client && params.client !== "all") ||
        (params.type && params.type !== "all") ? (
          <div className="flex items-end">
            <Link
              href="/accounting/audit-trail"
              className="px-2 py-1.5 text-sm text-[var(--cf-accent)] hover:underline"
            >
              Clear
            </Link>
          </div>
        ) : null}
      </form>

      <Panel
        title="Event history"
        description={`${filtered.length} event${filtered.length === 1 ? "" : "s"}`}
      >
        <AuditTrailList
          events={filtered}
          emptyMessage="No audit events match these filters."
        />
      </Panel>
    </div>
  );
}
