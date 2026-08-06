import { PageHeader } from "@/components/ui/page-header";
import { MessagesPanel } from "@/components/candidate/messages-panel";
import {
  getCandidateDeletedThreads,
  getCandidateHiddenThreadRoles,
  getCandidateMessages,
} from "@/lib/candidate/data";

export default async function CandidateMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ with?: string; folder?: string }>;
}) {
  const params = await searchParams;
  const withRecruiter = params.with?.trim() || null;
  const folder = params.folder === "deleted" ? "deleted" : "inbox";
  const [messages, deletedThreads, hiddenRoles] = await Promise.all([
    getCandidateMessages(),
    getCandidateDeletedThreads(),
    getCandidateHiddenThreadRoles(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Messages"
        description="Private chats with Recruiter and Accounting. Deleted conversations stay in Deleted for 30 days, then disappear from your view."
      />
      <MessagesPanel
        messages={messages}
        deletedThreads={deletedThreads}
        hiddenRoles={hiddenRoles}
        folder={folder}
        withRecruiter={withRecruiter}
      />
    </div>
  );
}
