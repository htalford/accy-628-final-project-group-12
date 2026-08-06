import { PageHeader } from "@/components/ui/page-header";
import { RecruiterProfileView } from "@/components/recruiter/profile-editor";
import { getRecruiterProfile } from "@/lib/recruiter/data";

export default async function ProfilePage() {
  const profile = await getRecruiterProfile();

  return (
    <div>
      <PageHeader title="Profile" />
      <RecruiterProfileView profile={profile} />
    </div>
  );
}
