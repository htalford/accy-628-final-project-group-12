"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/form";
import { ConfirmActionDialog } from "@/components/client-portal/confirm-action-dialog";
import { useToast } from "@/components/client-portal/toast";
import { updateSubmittalStageAction } from "@/app/actions/client-portal";
import type { PortalSubmittal, SubmittalStage } from "@/lib/types/database";
import {
  seedStatusTone,
  submittalStageLabel,
} from "@/lib/client-portal/labels";
import { paginate } from "@/lib/client-portal/pagination";

export function CandidatesClient({
  initial,
}: {
  initial: PortalSubmittal[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState("");
  const [position, setPosition] = useState("All");
  const [recruiter, setRecruiter] = useState("All");
  const [status, setStatus] = useState("All");
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<{
    id: string;
    name: string;
    next: Extract<SubmittalStage, "accepted" | "rejected">;
  } | null>(null);

  const positions = useMemo(
    () => [
      "All",
      ...Array.from(new Set(initial.map((c) => c.position_title || c.job_title || "—"))),
    ],
    [initial],
  );
  const recruiters = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(initial.map((c) => c.recruiter_name).filter(Boolean) as string[]),
      ),
    ],
    [initial],
  );

  const filtered = initial.filter((c) => {
    const pos = c.position_title || c.job_title || "";
    const matchesQ =
      !q ||
      c.candidate_name.toLowerCase().includes(q.toLowerCase()) ||
      pos.toLowerCase().includes(q.toLowerCase());
    return (
      matchesQ &&
      (position === "All" || pos === position) &&
      (recruiter === "All" || c.recruiter_name === recruiter) &&
      (status === "All" || c.stage === status)
    );
  });

  const paged = paginate(filtered, page);
  const hasFilters =
    q.trim() !== "" ||
    position !== "All" ||
    recruiter !== "All" ||
    status !== "All";

  async function confirmDecision(reason: string) {
    if (!dialog) return;
    const result = await updateSubmittalStageAction(
      dialog.id,
      dialog.next,
      reason,
    );
    if (result.ok) {
      toast.push(result.message, dialog.next === "accepted" ? "success" : "info");
      setDialog(null);
      startTransition(() => router.refresh());
    } else {
      toast.push(result.message, "error");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Candidates"
        description="Recruiter submittals and candidates who applied through the TalentQuest job board for your openings."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchInput
          className="sm:max-w-xs"
          placeholder="Search candidates…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
        <Select
          value={position}
          onChange={(e) => {
            setPosition(e.target.value);
            setPage(1);
          }}
        >
          {positions.map((p) => (
            <option key={p} value={p}>
              {p === "All" ? "All positions" : p}
            </option>
          ))}
        </Select>
        <Select
          value={recruiter}
          onChange={(e) => {
            setRecruiter(e.target.value);
            setPage(1);
          }}
        >
          {recruiters.map((r) => (
            <option key={r} value={r}>
              {r === "All" ? "All recruiters" : r}
            </option>
          ))}
        </Select>
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="All">All stages</option>
          <option value="submitted">Submitted</option>
          <option value="under_review">Under Review</option>
          <option value="interview">Interview</option>
          <option value="offer">Offer</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={
            hasFilters
              ? "No candidates match your filters"
              : "No submittals yet"
          }
          description={
            hasFilters
              ? "Clear filters to see all submittals."
              : "When recruiters submit people against your job requests, they appear here."
          }
          action={
            hasFilters ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setQ("");
                  setPosition("All");
                  setRecruiter("All");
                  setStatus("All");
                  setPage(1);
                }}
              >
                Clear filters
              </Button>
            ) : (
              <Button href="/client/job-requests" variant="secondary">
                View job requests
              </Button>
            )
          }
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {paged.items.map((c) => (
              <Card key={c.id} className="flex flex-col">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-[var(--cf-ink)]">
                      {c.candidate_name}
                    </p>
                    <p className="text-sm text-[var(--cf-muted)]">
                      {c.position_title || c.job_title || "Submittal"}
                    </p>
                  </div>
                  <Badge tone={seedStatusTone(c.stage)}>
                    {submittalStageLabel(c.stage)}
                  </Badge>
                </div>
                <p className="mb-3 text-xs text-[var(--cf-muted)]">
                  {c.recruiter_name ?? "Recruiter"} ·{" "}
                  {c.years_experience != null
                    ? `${c.years_experience} yrs exp`
                    : "Experience n/a"}
                </p>
                <div className="mt-auto flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    href={`/client/candidates/${c.id}`}
                  >
                    View Profile
                  </Button>
                  {c.stage !== "accepted" && c.stage !== "rejected" ? (
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
              </Card>
            ))}
          </div>
          <Pagination
            page={paged.page}
            totalPages={paged.totalPages}
            onPageChange={setPage}
          />
        </>
      )}

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
            ? `${dialog.name} — updates submittals.stage only (not placements or applications).`
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
