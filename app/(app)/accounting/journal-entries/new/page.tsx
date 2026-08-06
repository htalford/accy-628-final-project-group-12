import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { JournalEntryForm } from "@/components/accounting/journal-entry-form";

export default function NewJournalEntryPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/accounting/journal-entries"
          className="text-sm text-[var(--cf-accent)] hover:underline"
        >
          ← Back to journal entries
        </Link>
        <div className="mt-2">
          <PageHeader
            title="Add Journal Entry"
            description="Create a balanced double-entry journal posting."
          />
        </div>
      </div>
      <JournalEntryForm mode="create" />
    </div>
  );
}
