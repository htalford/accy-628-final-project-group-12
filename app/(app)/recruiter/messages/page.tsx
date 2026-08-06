import { PageHeader } from "@/components/ui/page-header";
import { MessagesCenter } from "@/components/recruiter/messages-center";
import { RECRUITER_PAGE_COPY } from "@/components/recruiter/summary-cards";
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
  const copy = RECRUITER_PAGE_COPY.messages;

  return (
    <div className="space-y-6">
      <PageHeader title={copy.title} description={copy.subtitle} />
      <MessagesCenter
        inboxThreads={inboxThreads}
        deletedThreads={deletedThreads}
        folder={folder}
      />
    </div>
  );
}
