import { PageHeader } from "@/components/ui/page-header";
import { MessagesPanel } from "@/components/candidate/messages-panel";
import { getCandidateMessages } from "@/lib/candidate/data";

export default async function CandidateMessagesPage() {
  const messages = await getCandidateMessages();

  return (
    <div>
      <PageHeader
        title="Messages"
        description="Talk with your recruiter and TalentQuest support from one inbox."
      />
      <MessagesPanel messages={messages} />
    </div>
  );
}
