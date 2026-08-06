import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/client-portal/breadcrumbs";
import { getJobRequestForClient } from "@/lib/client-portal/portal-data";
import {
  jobRequestStatusLabel,
  seedStatusTone,
} from "@/lib/client-portal/labels";

export default async function JobRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await getJobRequestForClient(id);
  if (!job) notFound();

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Job Requests", href: "/client/job-requests" },
          { label: job.title },
        ]}
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title={job.title}
          description={`${job.department} · Requested ${job.created_at.slice(0, 10)}`}
        />
        <div className="flex items-center gap-2">
          <Badge tone={seedStatusTone(job.status)}>
            {jobRequestStatusLabel(job.status)}
          </Badge>
          <Button variant="secondary" size="sm" href="/client/job-requests">
            Back to list
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardTitle className="mb-3">Request details</CardTitle>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--cf-muted)]">Positions</dt>
              <dd className="font-medium">{job.positions}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--cf-muted)]">Employment type</dt>
              <dd className="font-medium">{job.employment_type}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--cf-muted)]">Location</dt>
              <dd className="font-medium">{job.location ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--cf-muted)]">Pay rate</dt>
              <dd className="font-medium">{job.pay_rate_text ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--cf-muted)]">Start date</dt>
              <dd className="font-medium">
                {job.start_date?.slice(0, 10) ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--cf-muted)]">Recruiter</dt>
              <dd className="font-medium">{job.recruiter_name ?? "—"}</dd>
            </div>
          </dl>
        </Card>
        <Card>
          <CardTitle className="mb-3">Required skills</CardTitle>
          <div className="flex flex-wrap gap-2">
            {job.skills.length === 0 ? (
              <p className="text-sm text-[var(--cf-muted)]">None listed</p>
            ) : (
              job.skills.map((s) => (
                <Badge key={s} tone="navy">
                  {s}
                </Badge>
              ))
            )}
          </div>
        </Card>
        <Card>
          <CardTitle className="mb-3">Required certifications</CardTitle>
          <div className="flex flex-wrap gap-2">
            {(job.certifications ?? []).length === 0 ? (
              <p className="text-sm text-[var(--cf-muted)]">None listed</p>
            ) : (
              (job.certifications ?? []).map((c) => (
                <Badge key={c} tone="success">
                  {c}
                </Badge>
              ))
            )}
          </div>
        </Card>
        <Card className="md:col-span-2">
          <CardTitle className="mb-3">Job description</CardTitle>
          <p className="text-sm text-[var(--cf-ink)]">
            {job.description || "No description provided."}
          </p>
          {job.notes ? (
            <p className="mt-3 text-sm text-[var(--cf-muted)]">
              <span className="font-medium text-[var(--cf-ink)]">Notes: </span>
              {job.notes}
            </p>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
