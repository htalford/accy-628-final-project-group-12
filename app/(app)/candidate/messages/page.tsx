import { PageHeader } from "@/components/ui/page-header";
import { MessagesPanel } from "@/components/candidate/messages-panel";
import { getCandidateMessages } from "@/lib/candidate/data";

export default async function CandidateMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ with?: string }>;
}) {
  const params = await searchParams;
  const withRecruiter = params.with?.trim() || null;
  const messages = await getCandidateMessages();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Messages"
        description="Private chats with Recruiter and Accounting — each portal only sees its own conversation with you."
      />
      <MessagesPanel messages={messages} withRecruiter={withRecruiter} />
    </div>
  );
}
