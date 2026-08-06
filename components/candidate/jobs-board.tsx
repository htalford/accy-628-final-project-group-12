"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPin, Trash2, Briefcase, Building2 } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { ApplyButton } from "@/components/candidate/apply-button";
import { StatusPill } from "@/components/candidate/ui";
import { MatchedSkills } from "@/components/matching/match-score-badge";
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

function MatchStrengthLabel({ score }: { score: number }) {
  const strong = score >= MATCH_RECRUITER_THRESHOLD;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
        strong
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-slate-200 bg-slate-100 text-slate-600"
      }`}
    >
      {strong ? "Strong match" : "Weak match"}
    </span>
  );
}

export function CandidateJobsBoard({
  jobs,
  hasIndustry,
}: {
  jobs: CandidateJobRow[];
  hasIndustry: boolean;
}) {
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

  const visibleJobs = useMemo(() => {
    return jobs
      .filter((job) => !hidden.has(job.id))
      .sort((a, b) => {
        const sa = a.matchScore ?? 0;
        const sb = b.matchScore ?? 0;
        if (sb !== sa) return sb - sa;
        if (a.applied !== b.applied) return a.applied ? 1 : -1;
        return 0;
      });
  }, [jobs, hidden]);

  if (!hasIndustry) {
    return (
      <EmptyState
        title="Choose your industry first"
        description="Set your industry on your profile so we can show openings that fit that field."
      />
    );
  }

  if (jobs.length === 0) {
    return (
      <EmptyState
        title="No openings in your industry right now"
        description="Check back soon — recruiters post new roles for your industry as clients request coverage."
      />
    );
  }

  if (!ready) {
    return (
      <div className="rounded-2xl border border-[var(--cf-border)] bg-white px-5 py-10 text-sm text-[var(--cf-muted)]">
        Loading jobs…
      </div>
    );
  }

  if (visibleJobs.length === 0) {
    return (
      <EmptyState
        title="No jobs on your list"
        description="You removed every listing. New openings in your industry will appear here when they’re posted."
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--cf-muted)]">
        Showing{" "}
        <span className="font-semibold text-[var(--cf-ink)]">
          {visibleJobs.length}
        </span>{" "}
        opening{visibleJobs.length === 1 ? "" : "s"} in your industry, best matches first.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visibleJobs.map((job) => (
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
              <MatchStrengthLabel score={job.matchScore ?? 0} />
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
              {job.applied ? <StatusPill label="Applied" tone="good" /> : null}
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
                {job.applied ? (
                  <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-center text-sm font-semibold text-emerald-800">
                    Applied
                  </p>
                ) : (
                  <ApplyButton
                    jobId={job.id}
                    jobTitle={job.title}
                    profileResumeUrl={job.profileResumeUrl}
                    fullWidth
                  />
                )}
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
