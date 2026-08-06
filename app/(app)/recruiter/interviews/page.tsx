import { PageHeader } from "@/components/ui/page-header";
import { InterviewCalendar } from "@/components/recruiter/interview-calendar";
import { listInterviews } from "@/lib/recruiter/data";

export default async function InterviewsPage() {
  const interviews = await listInterviews();

  return (
    <div>
      <PageHeader title="Interviews Scheduled" />
      <InterviewCalendar interviews={interviews} />
    </div>
  );
}
