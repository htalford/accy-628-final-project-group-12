import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getClient,
  listJobOrders,
  listPlacementsThisMonth,
} from "@/lib/recruiter/data";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();

  const [jobs, placements] = await Promise.all([
    listJobOrders({ client: client.company }),
    listPlacementsThisMonth(),
  ]);
  const clientPlacements = placements.filter((p) => p.client === client.company);

  return (
    <div className="space-y-6">
      <PageHeader
        title={client.company}
        actions={
          <Link
            href="/recruiter/clients"
            className="rounded-lg border border-[var(--cf-border)] bg-white px-3 py-2 text-sm shadow-sm"
          >
            Back to clients
          </Link>
        }
      />

      <section className="rounded-xl border border-[var(--cf-border)] bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-[var(--cf-ink)]">
          Company Information
        </h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-[var(--cf-muted)] uppercase">Industry</dt>
            <dd>{client.industry ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--cf-muted)] uppercase">Status</dt>
            <dd>
              <StatusBadge status={client.status} />
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--cf-muted)] uppercase">
              Primary contact
            </dt>
            <dd>{client.primaryContact}</dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--cf-muted)] uppercase">Email</dt>
            <dd>{client.email}</dd>
          </div>
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/recruiter/messages"
            className="rounded-lg bg-[var(--cf-navy)] px-3 py-2 text-xs font-medium text-white"
          >
            Send Message
          </Link>
          <Link
            href="/recruiter/job-orders"
            className="rounded-lg border border-[var(--cf-border)] px-3 py-2 text-xs font-medium"
          >
            Create Job Order Request
          </Link>
          <button
            type="button"
            disabled
            className="rounded-lg border border-[var(--cf-border)] px-3 py-2 text-xs font-medium opacity-60"
          >
            View Contract
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--cf-border)] bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold">Open Job Orders</h2>
        {jobs.length === 0 ? (
          <p className="text-sm text-[var(--cf-muted)]">No open jobs.</p>
        ) : (
          <ul className="space-y-2">
            {jobs.map((j) => (
              <li key={j.id} className="flex items-center justify-between gap-3">
                <Link
                  href={`/recruiter/job-orders/${j.id}`}
                  className="font-medium text-[var(--cf-navy)] hover:underline"
                >
                  {j.title}
                </Link>
                <StatusBadge status={j.status} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-[var(--cf-border)] bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold">Active Placements</h2>
        {clientPlacements.length === 0 ? (
          <p className="text-sm text-[var(--cf-muted)]">No placements.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {clientPlacements.map((p) => (
              <li key={p.id} className="flex justify-between gap-3">
                <span>
                  {p.candidate} · {p.job}
                </span>
                <StatusBadge status={p.status} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-[var(--cf-border)] bg-white p-5 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold">Read-only Contract Summary</h2>
        <p className="text-sm text-[var(--cf-muted)]">
          Standard staffing agreement for {client.company}. Full contract viewer
          will connect to the Contracts module later.
        </p>
      </section>
    </div>
  );
}
