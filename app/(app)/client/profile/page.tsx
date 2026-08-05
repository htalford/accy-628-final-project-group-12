import { loadClientPortalData } from "@/lib/client-portal/queries";
import { companyProfile as mockProfile } from "@/lib/client-portal/mock-data";
import { ProfileClient } from "./profile-client";

export default async function ProfilePage() {
  const data = await loadClientPortalData();
  const c = data.client;

  const profile = {
    ...mockProfile,
    companyName: c?.name ?? mockProfile.companyName,
    industry: c?.industry ?? mockProfile.industry,
    email: c?.billing_email ?? data.user.email,
    primaryContact: data.user.name,
    companyId: c?.id ?? mockProfile.companyId,
    username: data.user.email,
  };

  return <ProfileClient initial={profile} />;
}
