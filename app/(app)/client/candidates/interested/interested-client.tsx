"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, THead, Th, Td } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { InterestedCandidateRow } from "@/lib/client-portal/types";

export function InterestedCandidatesClient({
  initial,
}: {
  initial: InterestedCandidateRow[];
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader title="Interested candidates" />
        <Button href="/client/candidates" variant="secondary">
          Back to applications
        </Button>
      </div>

      {initial.length === 0 ? (
        <EmptyState
          title="No interest yet"
          description="When candidates on the talent board mark your jobs as interested, they show up here so you can follow up."
          action={
            <Button href="/client/candidates" variant="secondary">
              View applications
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--cf-border)] bg-white shadow-sm">
          <Table>
            <THead>
              <tr>
                <Th>Candidate</Th>
                <Th>Job</Th>
                <Th>Marked interest</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </THead>
            <tbody>
              {initial.map((row) => (
                <tr key={row.interestId} className="hover:bg-[var(--cf-surface)]/60">
                  <Td>
                    <p className="font-medium text-[var(--cf-ink)]">{row.name}</p>
                    <p className="text-xs text-[var(--cf-muted)]">
                      {row.email ?? "No email on file"}
                    </p>
                  </Td>
                  <Td>
                    <p className="text-sm text-[var(--cf-ink)]">{row.jobTitle}</p>
                    {row.jobLocation ? (
                      <p className="text-xs text-[var(--cf-muted)]">
                        {row.jobLocation}
                      </p>
                    ) : null}
                  </Td>
                  <Td className="text-sm tabular-nums text-[var(--cf-muted)]">
                    {row.interestedAt.slice(0, 10)}
                  </Td>
                  <Td>
                    {row.applicationId ? (
                      <Badge tone="navy">Also applied</Badge>
                    ) : (
                      <Badge tone="muted">Interest only</Badge>
                    )}
                  </Td>
                  <Td>
                    {row.detailHref ? (
                      <Button size="sm" variant="secondary" href={row.detailHref}>
                        View application
                      </Button>
                    ) : (
                      <span className="text-xs text-[var(--cf-muted)]">
                        No application yet
                      </span>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      <p className="text-xs text-[var(--cf-muted)]">
        Source:{" "}
        <Link href="/candidate/jobs" className="text-[var(--cf-navy)] hover:underline">
          candidate portal jobs board
        </Link>{" "}
        interest flags (job_interests).
      </p>
    </div>
  );
}
