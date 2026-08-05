import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable, StatusPill } from "@/components/candidate/ui";
import {
  formatDate,
  getCandidateApplications,
} from "@/lib/candidate/data";

function toneForStatus(status: string) {
  if (status === "offered" || status === "interview") return "good" as const;
  if (status === "rejected" || status === "withdrawn") return "bad" as const;
  if (status === "reviewing") return "warn" as const;
  return "neutral" as const;
}

export default async function CandidateApplicationsPage() {
  const applications = await getCandidateApplications();

  return (
    <div>
      <PageHeader
        title="Applications"
        description="Track every role you’ve applied to and where it stands."
      />
      {applications.length === 0 ? (
        <EmptyState
          title="No applications yet"
          description="Browse Available jobs and apply — your submissions will land here."
        />
      ) : (
        <DataTable
          headers={[
            "Role",
            "Employer",
            "Location",
            "Type",
            "Status",
            "Applied",
            "Note",
          ]}
        >
          {applications.map((app) => (
            <tr key={app.id}>
              <td className="px-4 py-3 font-medium">
                {app.jobs?.title ?? "Role"}
              </td>
              <td className="px-4 py-3">
                {app.jobs?.employer_name ?? "—"}
              </td>
              <td className="px-4 py-3">{app.jobs?.location ?? "—"}</td>
              <td className="px-4 py-3 capitalize">
                {app.jobs?.employment_type ?? "—"}
              </td>
              <td className="px-4 py-3">
                <StatusPill label={app.status} tone={toneForStatus(app.status)} />
              </td>
              <td className="px-4 py-3">{formatDate(app.created_at)}</td>
              <td className="px-4 py-3 text-[var(--cf-muted)]">
                {app.note ?? "—"}
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
