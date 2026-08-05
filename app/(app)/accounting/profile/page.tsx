import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/accounting/panel";
import { getAppUser } from "@/lib/auth/get-app-user";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import { ProfileEditor } from "@/components/accounting/profile-editor";

export default async function ProfilePage() {
  const user = await getAppUser();
  if (!user) redirect("/login");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Your accounting user profile from Supabase users."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Employee Information">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--cf-muted)]">Name</dt>
              <dd className="font-medium">{user.name}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--cf-muted)]">Job Title</dt>
              <dd>Staff Accountant</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--cf-muted)]">Employee ID</dt>
              <dd className="font-mono text-xs">{user.id.slice(0, 8).toUpperCase()}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--cf-muted)]">Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--cf-muted)]">Phone Number</dt>
              <dd>— </dd>
            </div>
          </dl>
        </Panel>

        <Panel title="Account Settings">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--cf-muted)]">Username</dt>
              <dd>{user.email.split("@")[0]}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--cf-muted)]">Department</dt>
              <dd>Finance</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--cf-muted)]">Role</dt>
              <dd>{ROLE_LABELS[user.role]}</dd>
            </div>
          </dl>
        </Panel>
      </div>

      <ProfileEditor
        name={user.name}
        email={user.email}
        roleLabel={ROLE_LABELS[user.role]}
      />
    </div>
  );
}
