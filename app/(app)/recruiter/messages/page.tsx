import { PageHeader } from "@/components/ui/page-header";
import { MessagesCenter } from "@/components/recruiter/messages-center";
import { listMessageThreads } from "@/lib/recruiter/data";

export default async function MessagesPage() {
  const threads = await listMessageThreads();

  return (
    <div>
      <PageHeader
        title="Messages"
        description="Conversations with candidates and employers."
      />
      <MessagesCenter threads={threads} />
    </div>
  );
}
