import { Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable, StatusPill } from "@/components/candidate/ui";
import { ApplicationFocus } from "@/components/candidate/application-focus";
import { ApplicationDecisionActions } from "@/components/candidate/application-decision-actions";
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

function materialsSummary(app: {
  include_profile: boolean;
  cover_letter: string | null;
  resume_url: string | null;
  note: string | null;
}) {
  const parts: string[] = [];
  if (app.include_profile) parts.push("Profile");
  if (app.cover_letter) parts.push("Cover letter");
  if (app.resume_url) parts.push("Resume");
  if (parts.length === 0) return app.note ?? "—";
  return parts.join(" · ");
}

export default async function CandidateApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ app?: string }>;
}) {
  const params = await searchParams;
  const focusId = params.app?.trim() || null;
  const applications = await getCandidateApplications();

  return (
    <div>
      <PageHeader
        title="Applications"
        description="Track every role you’ve applied to. Offers and declines stay in your notification bell until you respond."
      />
      {applications.length === 0 ? (
        <EmptyState
          title="No applications yet"
          description="Browse Available jobs and apply — your submissions will land here."
        />
      ) : (
        <Suspense fallback={null}>
          <ApplicationFocus>
            <DataTable
              headers={[
                "Role",
                "Employer",
                "Location",
                "Type",
                "Status",
                "Applied",
                "Materials",
              ]}
            >
              {applications.map((app) => {
                const needsOfferResponse =
                  app.status === "offered" && !app.candidate_decision;
                const needsRejectionAck =
                  app.status === "rejected" &&
                  app.candidate_decision !== "acknowledged";
                return (
                  <tr
                    key={app.id}
                    id={`application-${app.id}`}
                    className={
                      focusId === app.id
                        ? "bg-[var(--cf-accent)]/5 scroll-mt-24"
                        : "scroll-mt-24"
                    }
                  >
                    <td className="px-4 py-3 font-medium">
                      {app.jobs?.title ?? "Role"}
                      {needsOfferResponse || needsRejectionAck ? (
                        <ApplicationDecisionActions
                          applicationId={app.id}
                          mode={needsOfferResponse ? "offer" : "rejected"}
                        />
                      ) : app.candidate_decision ? (
                        <p className="mt-1 text-xs font-medium capitalize text-[var(--cf-muted)]">
                          Your response: {app.candidate_decision}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      {app.jobs?.employer_name ?? "—"}
                    </td>
                    <td className="px-4 py-3">{app.jobs?.location ?? "—"}</td>
                    <td className="px-4 py-3 capitalize">
                      {app.jobs?.employment_type ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill
                        label={app.status}
                        tone={toneForStatus(app.status)}
                      />
                    </td>
                    <td className="px-4 py-3">{formatDate(app.created_at)}</td>
                    <td className="px-4 py-3 text-[var(--cf-muted)]">
                      <div className="space-y-1">
                        <p>{materialsSummary(app)}</p>
                        {app.resume_url ? (
                          <a
                            href={app.resume_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-medium text-[var(--cf-accent)] hover:underline"
                          >
                            View resume
                          </a>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </DataTable>
          </ApplicationFocus>
        </Suspense>
      )}
    </div>
  );
}
