import { PageHeader } from "@/components/ui/page-header";
import { AccountingMessagesClient } from "@/components/accounting/messages-client";
import { listStaffCandidateThreads } from "@/lib/staff/messages";

export default async function AccountingMessagesPage() {
  const threads = await listStaffCandidateThreads("accounting");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Messages"
        description="Conversations with candidates about pay and timesheets. Recruiter chats stay in the recruiter portal."
      />
      <AccountingMessagesClient threads={threads} />
    </div>
  );
}
