import { PageHeader } from "@/components/ui/page-header";
import { AccountingMessagesCenter } from "@/components/accounting/messages-center";
import { listAccountingMessageThreads } from "@/lib/accounting/messages";

export default async function AccountingMessagesPage() {
  const threads = await listAccountingMessageThreads();

  return (
    <div className="space-y-6">
      <PageHeader title="Messages" />
      <AccountingMessagesCenter threads={threads} />
    </div>
  );
}
