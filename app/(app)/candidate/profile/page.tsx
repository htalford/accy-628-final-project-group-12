import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ProfileForm } from "@/components/candidate/profile-form";
import { getCandidateEmployee } from "@/lib/candidate/data";

export default async function CandidateProfilePage() {
  const { user, employee } = await getCandidateEmployee();

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
        <div className="rounded-xl border border-[var(--cf-border)] bg-white p-5 shadow-sm">
          <ProfileForm user={user} employee={employee} />
        </div>
      )}
    </div>
  );
}
