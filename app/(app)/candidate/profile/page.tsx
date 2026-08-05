import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ProfileForm } from "@/components/candidate/profile-form";
import { ProfileCompletionCard } from "@/components/candidate/profile-completion-card";
import { getCandidateEmployee } from "@/lib/candidate/data";
import { getProfileCompletion } from "@/lib/candidate/profile-completion";

export default async function CandidateProfilePage() {
  const { user, employee } = await getCandidateEmployee();
  const completion = getProfileCompletion(employee);

  return (
    <div>
      <PageHeader
        title="Profile"
        description="View and update the contact details recruiters use for placements."
      />
      {!user || !employee ? (
        <EmptyState
          title="Profile unavailable"
          description="Your account is missing a linked employee record. Ask a recruiter to reconnect it."
        />
      ) : (
        <div className="space-y-6">
          <ProfileCompletionCard completion={completion} showCta={false} />
          <div className="rounded-xl border border-[var(--cf-border)] bg-white p-5 shadow-sm sm:p-6">
            <ProfileForm user={user} employee={employee} />
          </div>
        </div>
      )}
    </div>
  );
}
