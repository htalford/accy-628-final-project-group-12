"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/client-portal/breadcrumbs";
import { ConfirmActionDialog } from "@/components/client-portal/confirm-action-dialog";
import { useToast } from "@/components/client-portal/toast";
import {
  updateApplicationStatusAction,
  updateSubmittalStageAction,
} from "@/app/actions/client-portal";
import { updateApplicationStatus } from "@/app/actions/recruiter";
import type { ClientCandidate, SubmittalStage } from "@/lib/types/database";
import {
  seedStatusTone,
  submittalStageLabel,
} from "@/lib/client-portal/labels";

export function CandidateDetailClient({
  initial,
  listHref = "/client/candidates",
  listLabel = "Candidates",
}: {
  initial: ClientCandidate;
  listHref?: string;
  listLabel?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [dialog, setDialog] = useState<
    Extract<SubmittalStage, "accepted" | "rejected"> | null
  >(null);
  const [candidate, setCandidate] = useState(initial);
  const isRecruiterView = listHref.startsWith("/recruiter");

  async function decide(
    stage: Extract<SubmittalStage, "accepted" | "rejected">,
    note: string,
  ) {
    if (isRecruiterView && candidate.source === "application") {
      const nextStatus = stage === "accepted" ? "offered" : "rejected";
      const result = await updateApplicationStatus(candidate.id, nextStatus);
      if (result.ok) {
        toast.push(
          stage === "accepted"
            ? result.message
            : `${candidate.candidate_name} rejected.${note.trim() ? ` (${note.trim()})` : ""}`,
          stage === "accepted" ? "success" : "info",
        );
        setCandidate((c) => ({
          ...c,
          stage: stage === "accepted" ? "offer" : "rejected",
          interview_notes: note
            ? `${c.interview_notes ?? ""} · Decision note: ${note}`.replace(
                /^ · /,
                "",
              )
            : c.interview_notes,
        }));
        setDialog(null);
        startTransition(() => router.refresh());
      } else {
        toast.push(result.error, "error");
      }
      return;
    }

    const result =
      candidate.source === "application"
        ? await updateApplicationStatusAction(candidate.id, stage, note)
        : await updateSubmittalStageAction(candidate.id, stage, note);
    if (result.ok) {
      toast.push(result.message, stage === "accepted" ? "success" : "info");
      setCandidate((c) => ({
        ...c,
        stage: stage === "accepted" && c.source === "application" ? "offer" : stage,
        interview_notes: note
          ? `${c.interview_notes ?? ""} · Decision note: ${note}`.replace(
              /^ · /,
              "",
            )
          : c.interview_notes,
      }));
      setDialog(null);
      startTransition(() => router.refresh());
    } else {
      toast.push(result.message, "error");
    }
  }

  const canDecide =
    candidate.stage !== "accepted" &&
    candidate.stage !== "rejected" &&
    !(candidate.source === "application" && candidate.stage === "offer");

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: listLabel, href: listHref },
          { label: candidate.candidate_name },
        ]}
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader title={candidate.candidate_name} />
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={seedStatusTone(candidate.stage)}>
            {submittalStageLabel(candidate.stage)}
          </Badge>
          {canDecide ? (
            <>
              <Button
                size="sm"
                variant="success"
                type="button"
                disabled={pending}
                onClick={() => setDialog("accepted")}
              >
                Accept
              </Button>
              <Button
                size="sm"
                variant="danger"
                type="button"
                disabled={pending}
                onClick={() => setDialog("rejected")}
              >
                Reject
              </Button>
            </>
          ) : null}
          <Button size="sm" variant="secondary" href={listHref}>
            Back
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardTitle className="mb-3">Contact</CardTitle>
          <p className="text-sm">{candidate.candidate_email ?? "—"}</p>
          <p className="text-sm text-[var(--cf-muted)]">
            {candidate.candidate_phone ?? "—"}
          </p>
          <p className="mt-2 text-sm">
            {candidate.years_experience != null
              ? `${candidate.years_experience} years experience`
              : "Experience not provided"}
          </p>
          <p className="mt-2 text-xs text-[var(--cf-muted)]">
            Source: {candidate.source_label}
          </p>
        </Card>
        <Card>
          <CardTitle className="mb-3">Resume</CardTitle>
          <Badge tone="navy">{candidate.resume_status}</Badge>
          {candidate.resume_url ? (
            <p className="mt-2">
              <a
                href={candidate.resume_url}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-[var(--cf-navy)] underline"
              >
                Open resume / attachment
              </a>
            </p>
          ) : null}
          <p className="mt-3 text-sm whitespace-pre-wrap text-[var(--cf-ink)]">
            {candidate.resume_summary || "No summary on file."}
          </p>
        </Card>
        {candidate.cover_letter ? (
          <Card className="md:col-span-2">
            <CardTitle className="mb-3">Cover letter</CardTitle>
            <p className="text-sm whitespace-pre-wrap text-[var(--cf-ink)]">
              {candidate.cover_letter}
            </p>
          </Card>
        ) : null}
        <Card>
          <CardTitle className="mb-3">Skills</CardTitle>
          <div className="flex flex-wrap gap-2">
            {candidate.skills.length === 0 ? (
              <p className="text-sm text-[var(--cf-muted)]">None listed</p>
            ) : (
              candidate.skills.map((s) => (
                <Badge key={s} tone="navy">
                  {s}
                </Badge>
              ))
            )}
          </div>
        </Card>
        <Card>
          <CardTitle className="mb-3">Certifications</CardTitle>
          {candidate.certifications.length === 0 ? (
            <p className="text-sm text-[var(--cf-muted)]">None listed</p>
          ) : (
            <ul className="list-inside list-disc text-sm text-[var(--cf-ink)]">
              {candidate.certifications.map((cert) => (
                <li key={cert}>{cert}</li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="md:col-span-2">
          <CardTitle className="mb-3">Work Experience</CardTitle>
          {candidate.experience.length === 0 ? (
            <p className="text-sm text-[var(--cf-muted)]">None listed</p>
          ) : (
            <ul className="space-y-3">
              {candidate.experience.map((exp) => (
                <li key={`${exp.company}-${exp.title}`} className="text-sm">
                  <p className="font-medium text-[var(--cf-ink)]">
                    {exp.title} · {exp.company}
                  </p>
                  <p className="text-[var(--cf-muted)]">{exp.years}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="md:col-span-2">
          <CardTitle className="mb-3">Notes</CardTitle>
          <p className="text-sm text-[var(--cf-ink)]">
            {candidate.interview_notes || "No notes yet."}
          </p>
        </Card>
      </div>

      <ConfirmActionDialog
        open={dialog != null}
        onClose={() => setDialog(null)}
        title={
          dialog === "accepted" ? "Accept candidate?" : "Reject candidate?"
        }
        description={
          candidate.source === "application"
            ? `Confirm decision for ${candidate.candidate_name}. Updates their jobs board application.`
            : `Confirm decision for ${candidate.candidate_name}. Writes to submittals only.`
        }
        confirmLabel={dialog === "accepted" ? "Accept" : "Reject"}
        confirmVariant={dialog === "accepted" ? "success" : "danger"}
        requireReason={dialog === "rejected"}
        reasonLabel={
          dialog === "rejected"
            ? "Rejection reason (required)"
            : "Note (optional)"
        }
        busy={pending}
        onConfirm={(reason) => {
          if (!dialog) return;
          void decide(dialog, reason);
        }}
      />
    </div>
  );
}
