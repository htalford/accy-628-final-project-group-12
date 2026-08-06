import { PageHeader } from "@/components/ui/page-header";
import { InterviewCalendar } from "@/components/recruiter/interview-calendar";
import { RECRUITER_PAGE_COPY } from "@/components/recruiter/summary-cards";
import { listInterviews } from "@/lib/recruiter/data";

export default async function InterviewsPage() {
  const interviews = await listInterviews();
  const copy = RECRUITER_PAGE_COPY.interviews;

  return (
    <div>
      <PageHeader
        title="Interviews Scheduled"
        description={copy.subtitle}
      />
      <InterviewCalendar interviews={interviews} />
    </div>
  );
}
