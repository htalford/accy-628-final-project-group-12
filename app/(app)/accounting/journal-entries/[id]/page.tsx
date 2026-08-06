import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/accounting/panel";
import { StatusBadge, statusTone } from "@/components/ui/status-badge";
import { JournalEntryForm } from "@/components/accounting/journal-entry-form";
import { DeleteJournalEntryButton } from "@/components/accounting/delete-journal-entry-button";
import { getJournalEntryById } from "@/lib/accounting/queries";
import { accountLabel } from "@/lib/accounting/chart-of-accounts";
import { sourceHref } from "@/lib/accounting/journal-posting";
import {
  journalEntryStatusLabel,
  moneyExact,
  shortId,
} from "@/lib/accounting/format";

export default async function JournalEntryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { id } = await params;
  const { edit } = await searchParams;
  const entry = await getJournalEntryById(id);
  if (!entry) notFound();

  const editing = edit === "1";

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/accounting/journal-entries"
          className="text-sm text-[var(--cf-accent)] hover:underline"
        >
          ← Back to journal entries
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <PageHeader title={`Journal Entry ${shortId(entry.id)}`} />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge
                label={journalEntryStatusLabel(entry.status)}
                tone={statusTone(entry.status)}
              />
              <span className="text-sm text-[var(--cf-muted)]">
                {entry.entryDate}
              </span>
            </div>
          </div>
          {!editing ? (
            <div className="flex flex-wrap gap-2">
              <Button href={`/accounting/journal-entries/${entry.id}?edit=1`}>
                Edit
              </Button>
              <DeleteJournalEntryButton id={entry.id} />
            </div>
          ) : null}
        </div>
      </div>

      {editing ? (
        <JournalEntryForm
          mode="edit"
          entryId={entry.id}
          initial={{
            entryDate: entry.entryDate,
            memo: entry.memo,
            reference: entry.reference,
            status: entry.status,
            lines: entry.lines.map((line) => ({
              accountCode: line.accountCode,
              description: line.description,
              debit: line.debit,
              credit: line.credit,
            })),
          }}
        />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Details">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--cf-muted)]">Memo</dt>
                  <dd className="text-right">{entry.memo || "—"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--cf-muted)]">Reference</dt>
                  <dd className="text-right">{entry.reference || "—"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--cf-muted)]">Source</dt>
                  <dd className="text-right capitalize">
                    {(() => {
                      const href = sourceHref(entry.sourceType, entry.sourceId);
                      const label = entry.sourceType.replaceAll("_", " ");
                      return href ? (
                        <Link
                          href={href}
                          className="text-[var(--cf-accent)] hover:underline"
                        >
                          {label}
                        </Link>
                      ) : (
                        label
                      );
                    })()}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--cf-muted)]">Debits</dt>
                  <dd>{moneyExact(entry.debitTotal)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--cf-muted)]">Credits</dt>
                  <dd>{moneyExact(entry.creditTotal)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--cf-muted)]">Balance</dt>
                  <dd
                    className={
                      entry.balanced ? "text-emerald-700" : "text-amber-700"
                    }
                  >
                    {entry.balanced ? "Balanced" : "Unbalanced"}
                  </dd>
                </div>
              </dl>
            </Panel>
          </div>

          <Panel title="Lines">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-[var(--cf-border)] text-[var(--cf-muted)]">
                  <tr>
                    <th className="px-2 py-2 font-medium">#</th>
                    <th className="px-2 py-2 font-medium">Account</th>
                    <th className="px-2 py-2 font-medium">Description</th>
                    <th className="px-2 py-2 text-right font-medium">Debit</th>
                    <th className="px-2 py-2 text-right font-medium">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {entry.lines.map((line) => (
                    <tr
                      key={line.id}
                      className="border-b border-[var(--cf-border)]/70"
                    >
                      <td className="px-2 py-2">{line.lineNo}</td>
                      <td className="px-2 py-2">
                        {accountLabel(line.accountCode, line.accountName)}
                      </td>
                      <td className="px-2 py-2">
                        {line.description || "—"}
                      </td>
                      <td className="px-2 py-2 text-right">
                        {line.debit ? moneyExact(line.debit) : "—"}
                      </td>
                      <td className="px-2 py-2 text-right">
                        {line.credit ? moneyExact(line.credit) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}
