"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
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
import {
  toggleEmployerCandidateLikeAction,
  updateApplicationStatusAction,
} from "@/app/actions/client-portal";
import type { ClientCandidate, SubmittalStage } from "@/lib/types/database";
import {
  seedStatusTone,
  submittalStageLabel,
} from "@/lib/client-portal/labels";
import { paginate } from "@/lib/client-portal/pagination";
import { MatchScoreBadge, MatchedSkills } from "@/components/matching/match-score-badge";
import { MATCH_RECRUITER_THRESHOLD } from "@/lib/matching/threshold";

const MAX_COMPARE = 3;

export function CandidatesClient({
  initial,
  initialLikedIds = [],
}: {
  initial: ClientCandidate[];
  initialLikedIds?: string[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState("");
  const [position, setPosition] = useState("All");
  const [status, setStatus] = useState("All");
  const [likedOnly, setLikedOnly] = useState(false);
  /** all | high (>=60) | recruiter (<60) */
  const [matchBucket, setMatchBucket] = useState("all");
  const [page, setPage] = useState(1);
  const [likedIds, setLikedIds] = useState<Set<string>>(
    () => new Set(initialLikedIds),
  );
  const [selected, setSelected] = useState<string[]>([]);
  const [dialog, setDialog] = useState<{
    id: string;
    name: string;
    next: Extract<SubmittalStage, "accepted" | "rejected">;
  } | null>(null);

  useEffect(() => {
    setLikedIds(new Set(initialLikedIds));
  }, [initialLikedIds]);

  const candidatesOnly = useMemo(
    () => initial.filter((c) => c.source === "application"),
    [initial],
  );

  const positions = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          candidatesOnly.map((c) => c.position_title || c.job_title || "—"),
        ),
      ),
    ],
    [candidatesOnly],
  );

  const filtered = useMemo(() => {
    const list = candidatesOnly.filter((c) => {
      const pos = c.position_title || c.job_title || "";
      const matchesQ =
        !q || c.candidate_name.toLowerCase().includes(q.toLowerCase());
      const matchesLiked = !likedOnly || likedIds.has(c.id);
      const score = c.match_score ?? 0;
      const routed =
        c.routed_to_recruiter ?? score < MATCH_RECRUITER_THRESHOLD;
      const matchesScore =
        matchBucket === "all" ||
        (matchBucket === "high" && !routed && score >= MATCH_RECRUITER_THRESHOLD) ||
        (matchBucket === "recruiter" && routed);
      return (
        matchesQ &&
        matchesLiked &&
        matchesScore &&
        (position === "All" || pos === position) &&
        (status === "All" || c.stage === status)
      );
    });
    return [...list].sort((a, b) => (b.match_score ?? 0) - (a.match_score ?? 0));
  }, [candidatesOnly, q, likedOnly, likedIds, matchBucket, position, status]);

  const paged = paginate(filtered, page);
  const hasFilters =
    q.trim() !== "" ||
    position !== "All" ||
    status !== "All" ||
    likedOnly ||
    matchBucket !== "all";
  const routedCount = candidatesOnly.filter(
    (c) =>
      c.routed_to_recruiter ??
      (c.match_score != null && c.match_score < MATCH_RECRUITER_THRESHOLD),
  ).length;
  function toggleSelect(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_COMPARE) {
        toast.push(`You can compare up to ${MAX_COMPARE} candidates.`, "info");
        return prev;
      }
      return [...prev, id];
    });
  }

  function openCompare() {
    if (selected.length < 2) {
      toast.push("Select at least 2 candidates to compare.", "info");
      return;
    }
    router.push(
      `/client/candidates/compare?ids=${encodeURIComponent(selected.join(","))}`,
    );
  }

  function toggleLike(id: string, name: string) {
    const nextLiked = !likedIds.has(id);
    setLikedIds((prev) => {
      const copy = new Set(prev);
      if (nextLiked) copy.add(id);
      else copy.delete(id);
      return copy;
    });
    startTransition(async () => {
      const result = await toggleEmployerCandidateLikeAction(id, nextLiked);
      if (!result.ok) {
        setLikedIds((prev) => {
          const copy = new Set(prev);
          if (nextLiked) copy.delete(id);
          else copy.add(id);
          return copy;
        });
        toast.push(result.message, "error");
        return;
      }
      toast.push(
        nextLiked ? `Liked ${name}.` : `Removed like for ${name}.`,
        "success",
      );
      router.refresh();
    });
  }

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
        description={`People who applied to your open jobs. Fit scores use required skills; matches below ${MATCH_RECRUITER_THRESHOLD}% are auto-sent to a recruiter for review.`}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchInput
          className="sm:max-w-xs"
          placeholder="Search by candidate name…"
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
        <Select
          value={matchBucket}
          onChange={(e) => {
            setMatchBucket(e.target.value);
            setPage(1);
          }}
          className="sm:max-w-[14rem]"
        >
          <option value="all">Any match score</option>
          <option value="high">
            Strong / good ({MATCH_RECRUITER_THRESHOLD}%+)
          </option>
          <option value="recruiter">
            Sent to recruiter
            {routedCount > 0 ? ` (${routedCount})` : ""}
          </option>
        </Select>
        <Button
          type="button"
          variant={likedOnly ? "primary" : "secondary"}
          size="sm"
          onClick={() => {
            setLikedOnly((v) => !v);
            setPage(1);
          }}
          aria-pressed={likedOnly}
          title={
            likedOnly
              ? "Showing liked candidates only — click to show all"
              : "Show only candidates you liked"
          }
        >
          <Heart
            className={`mr-1.5 h-3.5 w-3.5 ${likedOnly ? "fill-current" : ""}`}
            aria-hidden
          />
          Liked
          {likedIds.size > 0 ? (
            <span className="ml-1.5 text-xs opacity-80">({likedIds.size})</span>
          ) : null}
        </Button>
        {selected.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            <span className="text-sm text-[var(--cf-muted)]">
              {selected.length} selected (max {MAX_COMPARE})
            </span>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setSelected([])}
            >
              Clear
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={selected.length < 2}
              onClick={openCompare}
            >
              Compare side by side
            </Button>
          </div>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={
            hasFilters
              ? likedOnly
                ? "No liked candidates match"
                : "No candidates match your filters"
              : "No candidates yet"
          }
          description={
            hasFilters
              ? likedOnly
                ? "Like a candidate with the heart on their card, or clear the Liked filter."
                : "Clear filters to see all candidates."
              : "When candidates apply to your posted jobs, they appear here."
          }
          action={
            hasFilters ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setQ("");
                  setPosition("All");
                  setStatus("All");
                  setLikedOnly(false);
                  setMatchBucket("all");
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
            {paged.items.map((c) => {
              const isSelected = selected.includes(c.id);
              const isLiked = likedIds.has(c.id);
              const routed =
                c.routed_to_recruiter ??
                (c.match_score != null &&
                  c.match_score < MATCH_RECRUITER_THRESHOLD);
              return (
                <Card
                  key={`${c.source}-${c.id}`}
                  className={`flex flex-col ${
                    isSelected
                      ? "border-[var(--cf-navy)] ring-1 ring-[var(--cf-navy)]/30"
                      : ""
                  }`}
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <label className="flex min-w-0 cursor-pointer items-start gap-2">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 shrink-0 rounded border-[var(--cf-border)] text-[var(--cf-navy)] focus:ring-[var(--cf-navy)]"
                        checked={isSelected}
                        onChange={() => toggleSelect(c.id)}
                        aria-label={`Select ${c.candidate_name} for compare`}
                      />
                      <span>
                        <span className="block font-semibold text-[var(--cf-ink)]">
                          {c.candidate_name}
                        </span>
                        <span className="block text-sm text-[var(--cf-muted)]">
                          {c.position_title || c.job_title || "Role"}
                        </span>
                      </span>
                    </label>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          toggleLike(c.id, c.candidate_name)
                        }
                        aria-pressed={isLiked}
                        aria-label={
                          isLiked
                            ? `Unlike ${c.candidate_name}`
                            : `Like ${c.candidate_name}`
                        }
                        title={isLiked ? "Liked — click to remove" : "Like candidate"}
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-md border transition disabled:opacity-50 ${
                          isLiked
                            ? "border-rose-200 bg-rose-50 text-rose-600"
                            : "border-[var(--cf-border)] text-[var(--cf-muted)] hover:border-rose-200 hover:bg-rose-50/50 hover:text-rose-600"
                        }`}
                      >
                        <Heart
                          className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`}
                          aria-hidden
                        />
                      </button>
                      {c.match_score != null ? (
                        <MatchScoreBadge
                          score={c.match_score}
                          band={c.match_band ?? "low"}
                          compact
                        />
                      ) : null}
                      {routed ? (
                        <Badge tone="warning">Sent to recruiter</Badge>
                      ) : null}
                      <Badge tone={seedStatusTone(c.stage)}>
                        {submittalStageLabel(c.stage)}
                      </Badge>
                    </div>
                  </div>
                  <p className="mb-1 text-xs text-[var(--cf-muted)]">
                    {c.candidate_email ?? "No email on file"}
                  </p>
                  {c.match_reasons?.[0] ? (
                    <p className="mb-1.5 text-xs text-[var(--cf-muted)]">
                      {c.match_reasons[0]}
                    </p>
                  ) : null}
                  <MatchedSkills
                    skills={c.match_skills}
                    className="mb-1.5"
                    emptyLabel={
                      c.match_score != null
                        ? "No matching skill tags yet"
                        : ""
                    }
                  />
                  <MatchedSkills
                    skills={c.match_certifications}
                    label="Matched certifications"
                    tone="certs"
                    className="mb-3"
                    emptyLabel={
                      c.match_score != null
                        ? "No matching certifications yet"
                        : ""
                    }
                  />
                  <div className="mt-auto flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" href={c.detail_href}>
                      View Profile
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
                </Card>
              );
            })}
          </div>
          <Pagination
            page={paged.page}
            totalPages={paged.totalPages}
            onPageChange={setPage}
          />
        </>
      )}

      {selected.length >= 2 ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--cf-border)] bg-white/95 p-3 shadow-lg backdrop-blur sm:hidden">
          <Button type="button" className="w-full" onClick={openCompare}>
            Compare {selected.length} selected
          </Button>
        </div>
      ) : null}

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
