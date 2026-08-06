import { PageHeader } from "@/components/ui/page-header";
import { CandidateInterviewCalendar } from "@/components/candidate/interview-calendar";
import { getCandidateInterviews } from "@/lib/candidate/data";

export default async function CandidateInterviewsPage() {
  const interviews = await getCandidateInterviews();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Interviews"
        description="Your scheduled interviews — preview list and calendar, matching the recruiter layout. Contact your recruiter if you need to reschedule."
      />
      <CandidateInterviewCalendar interviews={interviews} />
    </div>
  );
}
