"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPin, Trash2, Briefcase, Building2 } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { ApplyButton } from "@/components/candidate/apply-button";
import { StatusPill } from "@/components/candidate/ui";
import {
  MatchScoreBadge,
  MatchedSkills,
} from "@/components/matching/match-score-badge";
import type { MatchBand } from "@/lib/matching/score";
import { MATCH_RECRUITER_THRESHOLD } from "@/lib/matching/threshold";

export type CandidateJobRow = {
  id: string;
  title: string;
  description: string;
  employer: string;
  location: string;
  employmentType: string;
  payLabel: string;
  postedLabel: string;
  postedAt: string;
  applied: boolean;
  interested: boolean;
  profileResumeUrl: string | null;
  matchScore?: number;
  matchBand?: MatchBand;
  matchReasons?: string[];
  matchSkills?: string[];
  matchCerts?: string[];
};

const HIDDEN_STORAGE_KEY = "tq-candidate-hidden-jobs";

function readHidden(): Set<string> {
  try {
    const raw = window.localStorage.getItem(HIDDEN_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === "string"));
  } catch {
    return new Set();
  }
}

function writeHidden(ids: Set<string>) {
  try {
    window.localStorage.setItem(
      HIDDEN_STORAGE_KEY,
      JSON.stringify([...ids]),
    );
  } catch {
    /* ignore */
  }
}

export function CandidateJobsBoard({ jobs }: { jobs: CandidateJobRow[] }) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setHidden(readHidden());
    setReady(true);
  }, []);

  function removeJob(jobId: string) {
    setHidden((prev) => {
      const next = new Set(prev);
      next.add(jobId);
      writeHidden(next);
      return next;
    });
  }

  const matchedJobs = useMemo(() => {
    return jobs
      .filter((job) => {
        if (hidden.has(job.id)) return false;
        if (job.applied) return false;
        return (job.matchScore ?? 0) >= MATCH_RECRUITER_THRESHOLD;
      })
      .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
  }, [jobs, hidden]);

  if (jobs.length === 0) {
    return (
      <EmptyState
        title="No open jobs right now"
        description="Check back soon — recruiters post new openings as clients request coverage."
      />
    );
  }

  if (!ready) {
    return (
      <div className="rounded-2xl border border-[var(--cf-border)] bg-white px-5 py-10 text-sm text-[var(--cf-muted)]">
        Loading your matches…
      </div>
    );
  }

  if (matchedJobs.length === 0) {
    return (
      <EmptyState
        title="No matches yet"
        description="Jobs that fit your profile appear here. Add certifications, education, work history, and a resume to improve your matches."
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--cf-muted)]">
        Showing{" "}
        <span className="font-semibold text-[var(--cf-ink)]">
          {matchedJobs.length}
        </span>{" "}
        role{matchedJobs.length === 1 ? "" : "s"} matched to your profile.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {matchedJobs.map((job) => (
          <article
            key={job.id}
            className="flex h-full flex-col rounded-2xl border border-[var(--cf-border)] bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold tracking-tight text-[var(--cf-ink)]">
                  {job.title}
                </h3>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-[var(--cf-muted)]">
                  <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span className="truncate">{job.employer}</span>
                </p>
              </div>
              <MatchScoreBadge
                score={job.matchScore ?? 0}
                band={job.matchBand ?? "low"}
              />
            </div>

            <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[var(--cf-muted)]">
              {job.description || "No description provided."}
            </p>

            <div className="mt-4 flex flex-wrap gap-2 text-xs text-[var(--cf-muted)]">
              <span className="inline-flex items-center gap-1 rounded-md border border-[var(--cf-border)] bg-[var(--cf-surface)] px-2 py-1">
                <MapPin className="h-3 w-3" aria-hidden />
                {job.location}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-[var(--cf-border)] bg-[var(--cf-surface)] px-2 py-1">
                <Briefcase className="h-3 w-3" aria-hidden />
                {job.payLabel}
              </span>
              <StatusPill label={job.employmentType} />
            </div>

            <MatchedSkills
              skills={job.matchSkills}
              className="mt-4"
              emptyLabel=""
            />
            <MatchedSkills
              skills={job.matchCerts}
              label="Matched certifications"
              tone="certs"
              className="mt-2"
              emptyLabel=""
            />

            <div className="mt-auto flex items-center gap-2 border-t border-[var(--cf-border)] pt-4">
              <div className="min-w-0 flex-1">
                <ApplyButton
                  jobId={job.id}
                  jobTitle={job.title}
                  profileResumeUrl={job.profileResumeUrl}
                  fullWidth
                />
              </div>
              <button
                type="button"
                onClick={() => removeJob(job.id)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-[var(--cf-border)] px-3 py-2.5 text-xs font-semibold text-[var(--cf-muted)] transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                aria-label={`Remove ${job.title} from your list`}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                Remove
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
