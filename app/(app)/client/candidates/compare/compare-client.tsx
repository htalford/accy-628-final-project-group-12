"use client";

import Link from "next/link";
import { useMemo, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/client-portal/breadcrumbs";
import { ConfirmActionDialog } from "@/components/client-portal/confirm-action-dialog";
import { useToast } from "@/components/client-portal/toast";
import { updateApplicationStatusAction } from "@/app/actions/client-portal";
import type { ClientCandidate, SubmittalStage } from "@/lib/types/database";
import {
  seedStatusTone,
  submittalStageLabel,
} from "@/lib/client-portal/labels";

function cellText(value: string | number | null | undefined, empty = "—") {
  if (value == null || value === "") return empty;
  return String(value);
}

function daysSince(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "—";
  const days = Math.max(0, Math.floor((Date.now() - t) / 86_400_000));
  if (days === 0) return "Today";
  if (days === 1) return "1 day";
  return `${days} days`;
}

const ROWS: Array<{
  key: string;
  label: string;
  render: (c: ClientCandidate) => ReactNode;
}> = [
  {
    key: "stage",
    label: "Stage",
    render: (c) => (
      <Badge tone={seedStatusTone(c.stage)}>{submittalStageLabel(c.stage)}</Badge>
    ),
  },
  {
    key: "position",
    label: "Position",
    render: (c) => cellText(c.position_title || c.job_title),
  },
  {
    key: "email",
    label: "Email",
    render: (c) => cellText(c.candidate_email),
  },
  {
    key: "phone",
    label: "Phone",
    render: (c) => cellText(c.candidate_phone),
  },
  {
    key: "applied",
    label: "In pipeline",
    render: (c) => daysSince(c.created_at),
  },
  {
    key: "resume",
    label: "Resume",
    render: (c) => cellText(c.resume_status),
  },
  {
    key: "skills",
    label: "Skills",
    render: (c) =>
      c.skills.length > 0 ? c.skills.join(", ") : "None listed",
  },
  {
    key: "certs",
    label: "Certifications",
    render: (c) =>
      c.certifications.length > 0 ? c.certifications.join(", ") : "None listed",
  },
  {
    key: "experience",
    label: "Experience",
    render: (c) =>
      c.years_experience != null
        ? `${c.years_experience} years`
        : c.experience.length > 0
          ? c.experience
              .map((e) => `${e.title} @ ${e.company} (${e.years})`)
              .join("; ")
          : "Not provided",
  },
  {
    key: "summary",
    label: "Summary / cover letter",
    render: (c) => {
      const text = c.cover_letter || c.resume_summary;
      if (!text) return "—";
      return text.length > 220 ? `${text.slice(0, 220)}…` : text;
    },
  },
  {
    key: "notes",
    label: "Interview notes",
    render: (c) => cellText(c.interview_notes),
  },
];

export function CandidateCompareClient({
  candidates,
}: {
  candidates: ClientCandidate[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [rows, setRows] = useState(candidates);
  const [dialog, setDialog] = useState<{
    id: string;
    name: string;
    next: Extract<SubmittalStage, "accepted" | "rejected">;
  } | null>(null);

  const title = useMemo(() => {
    if (rows.length === 0) return "Compare candidates";
    return `Compare ${rows.length} candidate${rows.length === 1 ? "" : "s"}`;
  }, [rows.length]);

  async function confirmDecision(reason: string) {
    if (!dialog) return;
    const result = await updateApplicationStatusAction(
      dialog.id,
      dialog.next,
      reason,
    );
    if (result.ok) {
      toast.push(
        result.message,
        dialog.next === "accepted" ? "success" : "info",
      );
      setRows((prev) =>
        prev.map((c) =>
          c.id === dialog.id
            ? {
                ...c,
                stage:
                  dialog.next === "accepted" ? "offer" : ("rejected" as const),
              }
            : c,
        ),
      );
      setDialog(null);
      startTransition(() => router.refresh());
    } else {
      toast.push(result.message, "error");
    }
  }

  if (rows.length === 0) {
    return (
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: "Candidates", href: "/client/candidates" },
            { label: "Compare" },
          ]}
        />
        <PageHeader title="Compare candidates" />
        <Button href="/client/candidates" variant="secondary">
          Back to candidates
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Candidates", href: "/client/candidates" },
          { label: "Compare" },
        ]}
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader title={title} />
        <Button href="/client/candidates" variant="secondary" size="sm">
          Change selection
        </Button>
      </div>

      <Card className="overflow-x-auto p-0">
        <div className="min-w-[640px]">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--cf-border)] bg-[var(--cf-surface)]">
                <th className="sticky left-0 z-10 w-40 bg-[var(--cf-surface)] px-4 py-3 text-left text-xs font-semibold tracking-wide text-[var(--cf-muted)] uppercase">
                  Attribute
                </th>
                {rows.map((c) => (
                  <th
                    key={c.id}
                    className="min-w-[200px] px-4 py-3 text-left align-bottom"
                  >
                    <p className="text-base font-semibold text-[var(--cf-ink)]">
                      {c.candidate_name}
                    </p>
                    <p className="text-xs font-normal text-[var(--cf-muted)]">
                      {c.position_title || c.job_title || "Role"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Button size="sm" variant="secondary" href={c.detail_href}>
                        Profile
                      </Button>
                      {c.stage !== "accepted" &&
                      c.stage !== "rejected" &&
                      c.stage !== "offer" ? (
                        <>
                          <Button
                            size="sm"
                            variant="success"
                            type="button"
                            disabled={pending}
                            onClick={() =>
                              setDialog({
                                id: c.id,
                                name: c.candidate_name,
                                next: "accepted",
                              })
                            }
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            type="button"
                            disabled={pending}
                            onClick={() =>
                              setDialog({
                                id: c.id,
                                name: c.candidate_name,
                                next: "rejected",
                              })
                            }
                          >
                            Reject
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr
                  key={row.key}
                  className="border-b border-[var(--cf-border)] last:border-0"
                >
                  <th className="sticky left-0 z-10 bg-white px-4 py-3 text-left text-xs font-semibold text-[var(--cf-muted)]">
                    {row.label}
                  </th>
                  {rows.map((c) => (
                    <td
                      key={`${c.id}-${row.key}`}
                      className="px-4 py-3 align-top text-[var(--cf-ink)]"
                    >
                      {row.render(c)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardTitle className="mb-2">How to use compare</CardTitle>
        <p className="text-sm text-[var(--cf-muted)]">
          Align candidates on stage, fit for the role, and documentation, then
          accept or reject without leaving this view. For the strongest compare,
          filter the list by one position first, then select people for the same
          opening.
        </p>
        <p className="mt-2 text-sm">
          <Link
            href="/client/candidates"
            className="font-medium text-[var(--cf-navy)] hover:underline"
          >
            ← Return to all candidates
          </Link>
        </p>
      </Card>

      <ConfirmActionDialog
        open={dialog != null}
        onClose={() => setDialog(null)}
        title={
          dialog?.next === "accepted"
            ? "Accept candidate?"
            : "Reject candidate?"
        }
        description={
          dialog
            ? `${dialog.name} — updates their jobs board application status.`
            : ""
        }
        confirmLabel={dialog?.next === "accepted" ? "Accept" : "Reject"}
        confirmVariant={dialog?.next === "accepted" ? "success" : "danger"}
        requireReason={dialog?.next === "rejected"}
        reasonLabel={
          dialog?.next === "rejected"
            ? "Rejection reason (required)"
            : "Note (optional)"
        }
        busy={pending}
        onConfirm={(reason) => void confirmDecision(reason)}
      />
    </div>
  );
}
