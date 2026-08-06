import { PageHeader } from "@/components/ui/page-header";
import { CandidateInterviewCalendar } from "@/components/candidate/interview-calendar";
import { getCandidateInterviews } from "@/lib/candidate/data";

export default async function CandidateInterviewsPage() {
  const interviews = await getCandidateInterviews();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Interviews"
        description="Your scheduled interviews in a calendar view, with the full list below."
      />
      <CandidateInterviewCalendar interviews={interviews} />
    </div>
  );
}
