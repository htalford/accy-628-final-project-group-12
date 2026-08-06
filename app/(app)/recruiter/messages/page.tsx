import { PageHeader } from "@/components/ui/page-header";
import { MessagesCenter } from "@/components/recruiter/messages-center";
import {
  listRecruiterDeletedThreads,
  listRecruiterInboxThreads,
} from "@/lib/recruiter/messages";

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ folder?: string }>;
}) {
  const params = await searchParams;
  const folder = params.folder === "deleted" ? "deleted" : "inbox";
  const [inboxThreads, deletedThreads] = await Promise.all([
    listRecruiterInboxThreads(),
    listRecruiterDeletedThreads(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Messages"
        description="Conversations with Employers, Candidates, and Accounting. Deleted items stay in Deleted for 30 days."
      />
      <MessagesCenter
        inboxThreads={inboxThreads}
        deletedThreads={deletedThreads}
        folder={folder}
      />
    </div>
  );
}
