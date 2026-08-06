import { PageHeader } from "@/components/ui/page-header";
import { MessagesCenter } from "@/components/recruiter/messages-center";
import { listMessageThreads } from "@/lib/recruiter/data";

export default async function MessagesPage() {
  const threads = await listMessageThreads();

  return (
    <div>
      <PageHeader
        title="Messages"
        description="Chat with candidates, employers, and accounting."
      />
      <MessagesCenter threads={threads} />
    </div>
  );
}
