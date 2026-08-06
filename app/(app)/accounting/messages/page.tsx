import { PageHeader } from "@/components/ui/page-header";
import { AccountingMessagesCenter } from "@/components/accounting/messages-center";
import {
  listAccountingDeletedThreads,
  listAccountingInboxThreads,
} from "@/lib/accounting/messages";

export default async function AccountingMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ folder?: string }>;
}) {
  const params = await searchParams;
  const folder = params.folder === "deleted" ? "deleted" : "inbox";
  const [inboxThreads, deletedThreads] = await Promise.all([
    listAccountingInboxThreads(),
    listAccountingDeletedThreads(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Messages"
        description="Chat with recruiters, employers, and candidates. Deleted conversations stay in Deleted for 30 days."
      />
      <AccountingMessagesCenter
        inboxThreads={inboxThreads}
        deletedThreads={deletedThreads}
        folder={folder}
      />
    </div>
  );
}
