import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge, statusTone } from "@/components/ui/status-badge";
import { JournalEntriesToolbar } from "@/components/accounting/journal-entries-toolbar";
import { getJournalEntries } from "@/lib/accounting/queries";
import {
  JOURNAL_ENTRY_STATUSES,
  journalEntryStatusLabel,
  moneyExact,
  shortId,
} from "@/lib/accounting/format";
import type { JournalEntryStatus } from "@/lib/types/database";

export default async function JournalEntriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const entries = await getJournalEntries();
  const statusFilter = params.status?.trim() ?? "all";
  const filtered =
    statusFilter !== "all" &&
    JOURNAL_ENTRY_STATUSES.includes(statusFilter as JournalEntryStatus)
      ? entries.filter((e) => e.status === statusFilter)
      : entries;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader title="Journal Entries" />
        <Button href="/accounting/journal-entries/new">Add Journal Entry</Button>
      </div>

      <JournalEntriesToolbar />

      <DataTable
        rows={filtered}
        rowHref={(row) => `/accounting/journal-entries/${row.id}`}
        emptyTitle="No journal entries"
        emptyDescription={
          statusFilter !== "all"
            ? `No ${journalEntryStatusLabel(statusFilter).toLowerCase()} journal entries.`
            : "Create a journal entry to start recording GL activity."
        }
        columns={[
          {
            key: "number",
            header: "Entry #",
            render: (row) => shortId(row.id),
          },
          {
            key: "date",
            header: "Date",
            render: (row) => row.entryDate,
          },
          {
            key: "source",
            header: "Source",
            render: (row) => row.sourceType.replaceAll("_", " "),
          },
          {
            key: "reference",
            header: "Reference",
            render: (row) => row.reference || "—",
          },
          {
            key: "memo",
            header: "Memo",
            render: (row) => row.memo || "—",
          },
          {
            key: "status",
            header: "Status",
            render: (row) => (
              <StatusBadge
                label={journalEntryStatusLabel(row.status)}
                tone={statusTone(row.status)}
              />
            ),
          },
          {
            key: "debits",
            header: "Debits",
            render: (row) => moneyExact(row.debitTotal),
          },
          {
            key: "credits",
            header: "Credits",
            render: (row) => moneyExact(row.creditTotal),
          },
          {
            key: "balance",
            header: "Balance",
            render: (row) =>
              row.balanced ? (
                <span className="text-emerald-700">Balanced</span>
              ) : (
                <span className="text-amber-700">Unbalanced</span>
              ),
          },
        ]}
      />
    </div>
  );
}
