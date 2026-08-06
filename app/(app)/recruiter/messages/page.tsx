import { PageHeader } from "@/components/ui/page-header";
import { MessagesCenter } from "@/components/recruiter/messages-center";
import { RECRUITER_PAGE_COPY } from "@/components/recruiter/summary-cards";
import { listMessageThreads } from "@/lib/recruiter/data";

export default async function MessagesPage() {
  const threads = await listMessageThreads();
  const copy = RECRUITER_PAGE_COPY.messages;

  return (
    <div>
      <PageHeader title={copy.title} description={copy.subtitle} />
      <MessagesCenter threads={threads} />
    </div>
  );
}
