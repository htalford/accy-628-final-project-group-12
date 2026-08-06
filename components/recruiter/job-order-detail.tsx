"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { FilePenLine, StickyNote, UserPlus } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import type { JobOrderStatus, RecruiterCandidate, RecruiterJobOrder } from "@/lib/recruiter/types";
import type { MatchResult } from "@/lib/matching/score";
import { MatchScoreBadge, MatchedSkills } from "@/components/matching/match-score-badge";
import {
  addJobNote,
  assignCandidateToJob,
  updateJobStatus,
} from "@/app/actions/recruiter";

export function JobOrderDetail({
  job,
  assignedCandidates,
  approvedCandidates,
  suggestedMatches = [],
}: {
  job: RecruiterJobOrder;
  assignedCandidates: RecruiterCandidate[];
  approvedCandidates: RecruiterCandidate[];
  suggestedMatches?: Array<{
    candidate: RecruiterCandidate;
    result: MatchResult;
  }>;
}) {
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [showStatus, setShowStatus] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [showNote, setShowNote] = useState(false);

  function run(action: () => Promise<{ ok: boolean; error?: string; message?: string }>) {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error ?? "Something went wrong");
      else setNotice(result.message ?? "Saved");
    });
  }

  return (
    <div className="space-y-6">
      {notice ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {notice}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-4 rounded-xl border border-[var(--cf-border)] bg-white p-5 shadow-sm lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--cf-ink)]">{job.title}</h2>
          <p className="mt-1 text-sm text-[var(--cf-muted)]">
            {job.clientId ? (
              <Link
                href={`/recruiter/clients/${job.clientId}`}
                className="font-medium text-[var(--cf-navy)] hover:underline"
              >
                {job.employerName || job.client}
              </Link>
            ) : (
              job.employerName || job.client
            )}{" "}
            · {job.location}
            {job.source === "employer_request" ? (
              <span className="ml-2 rounded-full bg-[var(--cf-accent)]/15 px-2 py-0.5 text-xs font-medium text-[var(--cf-navy)]">
                Employer request
              </span>
            ) : null}
          </p>
          <dl className="mt-3 grid gap-1 text-sm text-[var(--cf-muted)] sm:grid-cols-3">
            <div>
              <dt className="text-xs uppercase tracking-wide">Employer / Client</dt>
              <dd className="font-medium text-[var(--cf-ink)]">
                {job.clientId ? (
                  <Link
                    href={`/recruiter/clients/${job.clientId}`}
                    className="text-[var(--cf-navy)] hover:underline"
                  >
                    {job.company}
                  </Link>
                ) : (
                  job.company
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide">Primary contact</dt>
              <dd className="font-medium text-[var(--cf-ink)]">{job.primaryContact}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide">Company</dt>
              <dd className="font-medium text-[var(--cf-ink)]">{job.company}</dd>
            </div>
          </dl>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge status={job.status} />
            <StatusBadge status={job.priority} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => setShowStatus(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--cf-border)] px-3 py-2 text-xs font-medium"
          >
            <FilePenLine className="h-4 w-4" /> Edit Status
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setShowAssign(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--cf-border)] px-3 py-2 text-xs font-medium"
          >
            <UserPlus className="h-4 w-4" /> Assign Candidate
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setShowNote(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--cf-border)] px-3 py-2 text-xs font-medium"
          >
            <StickyNote className="h-4 w-4" /> Add Notes
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Job Description" className="lg:col-span-2">
          <p className="text-sm text-[var(--cf-ink)] whitespace-pre-wrap">
            {job.description || "No description provided."}
          </p>
          <p className="mt-3 text-xs text-[var(--cf-muted)]">
            Contract: {job.contractSummary}
          </p>
        </Card>
        <Card title="Rates & Recruiter">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--cf-muted)]">Pay rate</dt>
              <dd className="font-medium">${job.payRate}/hr</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--cf-muted)]">Bill / max rate</dt>
              <dd className="font-medium">${job.billRate}/hr</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--cf-muted)]">Assigned recruiter</dt>
              <dd className="font-medium">{job.assignedRecruiter}</dd>
            </div>
          </dl>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Automated matches">
          {suggestedMatches.length === 0 ? (
            <p className="text-sm text-[var(--cf-muted)]">
              No strong automated matches yet. Improve job skills/description
              or wait for more applications in the pipeline.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--cf-border)]">
              {suggestedMatches.map(({ candidate: c, result }) => (
                <li
                  key={c.id}
                  className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/recruiter/candidates/${c.id}`}
                      className="font-medium text-[var(--cf-navy)] hover:underline"
                    >
                      {c.name}
                    </Link>
                    <p className="text-xs text-[var(--cf-muted)]">
                      {c.positionApplied}
                      {c.jobId === job.id
                        ? " · applied to this order"
                        : result.score < 60
                          ? " · pool match · needs review"
                          : " · pool match"}
                    </p>
                    {result.reasons[0] ? (
                      <p className="mt-0.5 text-xs text-[var(--cf-muted)]">
                        {result.reasons[0]}
                      </p>
                    ) : null}
                    <MatchedSkills
                      skills={result.skillHits}
                      className="mt-1.5"
                      emptyLabel="No skill chips matched — score is from title/location only"
                    />
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <MatchScoreBadge
                      score={result.score}
                      band={result.band}
                      compact
                    />
                    <StatusBadge status={c.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Assigned Candidates">
          {assignedCandidates.length === 0 ? (
            <p className="text-sm text-[var(--cf-muted)]">
              No candidates assigned or applied yet.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--cf-border)]">
              {assignedCandidates.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div>
                    <Link
                      href={`/recruiter/candidates/${c.id}`}
                      className="font-medium text-[var(--cf-navy)] hover:underline"
                    >
                      {c.name}
                    </Link>
                    <p className="text-xs text-[var(--cf-muted)]">{c.email}</p>
                  </div>
                  <StatusBadge status={c.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Recruiter Notes">
          {job.recruiterNotes.length === 0 ? (
            <p className="text-sm text-[var(--cf-muted)]">No notes yet.</p>
          ) : (
            <ol className="space-y-3">
              {job.recruiterNotes.map((n) => (
                <li
                  key={n.id}
                  className="rounded-lg border border-[var(--cf-border)] px-3 py-2"
                >
                  <p className="text-sm text-[var(--cf-ink)] whitespace-pre-wrap">
                    {n.body}
                  </p>
                  <p className="mt-1 text-xs text-[var(--cf-muted)]">
                    {n.author} · {new Date(n.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </Card>
        <Card title="Required skills (match inputs)">
          {job.requiredSkills.length === 0 ? (
            <p className="text-sm text-[var(--cf-muted)]">
              No skill tags on this order yet. Skills on employer job requests
              improve automated ranking.
            </p>
          ) : (
            <ul className="flex flex-wrap gap-1.5">
              {job.requiredSkills.map((s) => (
                <li
                  key={s}
                  className="rounded-full border border-[var(--cf-border)] bg-[var(--cf-surface)] px-2.5 py-0.5 text-xs font-medium text-[var(--cf-ink)]"
                >
                  {s}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {showStatus ? (
        <SimpleModal title="Edit Status" onClose={() => setShowStatus(false)}>
          <select
            id="job-status"
            defaultValue={job.status === "Interviewing" ? "Open" : job.status}
            className="w-full rounded-lg border border-[var(--cf-border)] px-3 py-2 text-sm"
          >
            {(["Open", "Filled", "Closed"] as JobOrderStatus[]).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setShowStatus(false)}>
              Cancel
            </button>
            <button
              type="button"
              disabled={pending}
              className="rounded-lg bg-[var(--cf-navy)] px-3 py-2 text-sm text-white"
              onClick={() => {
                const el = document.getElementById("job-status") as HTMLSelectElement;
                setShowStatus(false);
                run(() => updateJobStatus(job.id, el.value as JobOrderStatus));
              }}
            >
              Save
            </button>
          </div>
        </SimpleModal>
      ) : null}

      {showAssign ? (
        <SimpleModal title="Assign Candidate" onClose={() => setShowAssign(false)}>
          {approvedCandidates.length === 0 ? (
            <p className="text-sm text-[var(--cf-muted)]">
              No approved candidates in the pipeline yet. Approve an application first.
            </p>
          ) : (
            <select
              id="assign-candidate"
              className="w-full rounded-lg border border-[var(--cf-border)] px-3 py-2 text-sm"
              defaultValue={job.assignedEmployeeId ?? ""}
            >
              <option value="" disabled>
                Select approved candidate
              </option>
              {approvedCandidates.map((c) => (
                <option key={c.employeeId} value={c.employeeId}>
                  {c.name} · {c.positionApplied}
                </option>
              ))}
            </select>
          )}
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setShowAssign(false)}>
              Cancel
            </button>
            <button
              type="button"
              disabled={pending || approvedCandidates.length === 0}
              className="rounded-lg bg-[var(--cf-navy)] px-3 py-2 text-sm text-white disabled:opacity-50"
              onClick={() => {
                const el = document.getElementById(
                  "assign-candidate",
                ) as HTMLSelectElement | null;
                if (!el?.value) return;
                setShowAssign(false);
                run(() => assignCandidateToJob(job.id, el.value));
              }}
            >
              Assign
            </button>
          </div>
        </SimpleModal>
      ) : null}

      {showNote ? (
        <SimpleModal title="Add Notes" onClose={() => setShowNote(false)}>
          <textarea
            id="job-note"
            rows={4}
            className="w-full rounded-lg border border-[var(--cf-border)] px-3 py-2 text-sm"
            placeholder="Add a recruiter note…"
          />
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setShowNote(false)}>
              Cancel
            </button>
            <button
              type="button"
              disabled={pending}
              className="rounded-lg bg-[var(--cf-navy)] px-3 py-2 text-sm text-white"
              onClick={() => {
                const el = document.getElementById("job-note") as HTMLTextAreaElement;
                if (!el.value.trim()) return;
                setShowNote(false);
                run(() => addJobNote(job.id, el.value.trim()));
              }}
            >
              Save note
            </button>
          </div>
        </SimpleModal>
      ) : null}
    </div>
  );
}

function Card({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-[var(--cf-border)] bg-white p-4 shadow-sm ${className}`}
    >
      <h3 className="mb-3 text-sm font-semibold text-[var(--cf-ink)]">{title}</h3>
      {children}
    </section>
  );
}

function SimpleModal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--cf-border)] bg-white p-5 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold">{title}</h3>
          <button type="button" onClick={onClose} className="text-sm text-[var(--cf-muted)]">
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
