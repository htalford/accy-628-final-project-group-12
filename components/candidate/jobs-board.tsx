"use client";

import { useMemo, useState } from "react";
import { SearchInput } from "@/components/ui/search-input";
import { FilterSelect } from "@/components/ui/filter-select";
import { EmptyState } from "@/components/ui/empty-state";
import { ApplyButton } from "@/components/candidate/apply-button";
import { InterestedButton } from "@/components/candidate/interested-button";
import { DataTable, StatusPill } from "@/components/candidate/ui";

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
};

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  );
}

function matchesSearch(row: CandidateJobRow, q: string) {
  if (!q) return true;
  const hay = [
    row.title,
    row.description,
    row.employer,
    row.location,
    row.employmentType,
    row.payLabel,
    row.postedLabel,
    row.applied ? "applied" : "not applied open apply",
    row.interested ? "interested thumbs up" : "",
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

export function CandidateJobsBoard({ jobs }: { jobs: CandidateJobRow[] }) {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [employer, setEmployer] = useState("all");
  const [location, setLocation] = useState("all");
  const [type, setType] = useState("all");
  const [pay, setPay] = useState("all");
  const [posted, setPosted] = useState("all");
  const [applied, setApplied] = useState("all");
  const [interest, setInterest] = useState("all");

  const roles = useMemo(() => uniqueSorted(jobs.map((j) => j.title)), [jobs]);
  const employers = useMemo(
    () => uniqueSorted(jobs.map((j) => j.employer)),
    [jobs],
  );
  const locations = useMemo(
    () => uniqueSorted(jobs.map((j) => j.location).filter((l) => l !== "—")),
    [jobs],
  );
  const types = useMemo(
    () => uniqueSorted(jobs.map((j) => j.employmentType)),
    [jobs],
  );
  const pays = useMemo(
    () => uniqueSorted(jobs.map((j) => j.payLabel).filter((p) => p !== "—")),
    [jobs],
  );
  const postedDates = useMemo(
    () => uniqueSorted(jobs.map((j) => j.postedLabel).filter((p) => p !== "—")),
    [jobs],
  );

  const q = search.trim().toLowerCase();

  const filtered = useMemo(() => {
    return jobs.filter((job) => {
      if (role !== "all" && job.title !== role) return false;
      if (employer !== "all" && job.employer !== employer) return false;
      if (location !== "all" && job.location !== location) return false;
      if (type !== "all" && job.employmentType !== type) return false;
      if (pay !== "all" && job.payLabel !== pay) return false;
      if (posted !== "all" && job.postedLabel !== posted) return false;
      if (applied === "applied" && !job.applied) return false;
      if (applied === "open" && job.applied) return false;
      if (interest === "interested" && !job.interested) return false;
      if (interest === "not" && job.interested) return false;
      return matchesSearch(job, q);
    });
  }, [
    jobs,
    role,
    employer,
    location,
    type,
    pay,
    posted,
    applied,
    interest,
    q,
  ]);

  const hasFilters =
    q !== "" ||
    role !== "all" ||
    employer !== "all" ||
    location !== "all" ||
    type !== "all" ||
    pay !== "all" ||
    posted !== "all" ||
    applied !== "all" ||
    interest !== "all";

  function clearFilters() {
    setSearch("");
    setRole("all");
    setEmployer("all");
    setLocation("all");
    setType("all");
    setPay("all");
    setPosted("all");
    setApplied("all");
    setInterest("all");
  }

  if (jobs.length === 0) {
    return (
      <EmptyState
        title="No open jobs right now"
        description="Check back soon — recruiters post new openings as clients request coverage."
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl border border-[var(--cf-border)] bg-white shadow-sm">
        <div className="border-b border-[var(--cf-border)] bg-[linear-gradient(180deg,var(--cf-surface)_0%,#fff_100%)] px-4 py-4 sm:px-5 sm:py-5">
          <div className="mb-2.5 flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--cf-ink)]">
                Search jobs
              </p>
              <p className="mt-0.5 text-xs text-[var(--cf-muted)]">
                Match any column — role, employer, location, type, pay, date, or
                status
              </p>
            </div>
            {hasFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[var(--cf-accent)] transition hover:bg-[var(--cf-accent)]/10"
              >
                Clear all
              </button>
            ) : null}
          </div>
          <SearchInput
            size="lg"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Try “Northwind”, “Accountant”, “Chicago”, or “interested”…"
            aria-label="Search available jobs"
          />
        </div>

        <div className="px-4 py-4 sm:px-5">
          <p className="mb-3 text-[11px] font-semibold tracking-[0.08em] text-[var(--cf-muted)] uppercase">
            Filter by column
          </p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
            <FilterSelect
              label="Role"
              value={role}
              onChange={setRole}
              options={[
                { value: "all", label: "All roles" },
                ...roles.map((s) => ({ value: s, label: s })),
              ]}
            />
            <FilterSelect
              label="Employer"
              value={employer}
              onChange={setEmployer}
              options={[
                { value: "all", label: "All employers" },
                ...employers.map((s) => ({ value: s, label: s })),
              ]}
            />
            <FilterSelect
              label="Location"
              value={location}
              onChange={setLocation}
              options={[
                { value: "all", label: "All locations" },
                ...locations.map((s) => ({ value: s, label: s })),
              ]}
            />
            <FilterSelect
              label="Type"
              value={type}
              onChange={setType}
              options={[
                { value: "all", label: "All types" },
                ...types.map((s) => ({ value: s, label: s })),
              ]}
            />
            <FilterSelect
              label="Pay range"
              value={pay}
              onChange={setPay}
              options={[
                { value: "all", label: "All pay ranges" },
                ...pays.map((s) => ({ value: s, label: s })),
              ]}
            />
            <FilterSelect
              label="Posted"
              value={posted}
              onChange={setPosted}
              options={[
                { value: "all", label: "All dates" },
                ...postedDates.map((s) => ({ value: s, label: s })),
              ]}
            />
            <FilterSelect
              label="Status"
              value={applied}
              onChange={setApplied}
              options={[
                { value: "all", label: "All statuses" },
                { value: "open", label: "Not applied" },
                { value: "applied", label: "Applied" },
              ]}
            />
            <FilterSelect
              label="Interest"
              value={interest}
              onChange={setInterest}
              options={[
                { value: "all", label: "All" },
                { value: "interested", label: "👍 Interested" },
                { value: "not", label: "Not marked" },
              ]}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-[var(--cf-border)] bg-[var(--cf-surface)]/60 px-4 py-2.5 sm:px-5">
          <p className="text-xs text-[var(--cf-muted)]">
            <span className="font-semibold text-[var(--cf-ink)]">
              {filtered.length}
            </span>{" "}
            of {jobs.length} job{jobs.length === 1 ? "" : "s"}
            {hasFilters ? " matching" : " available"}
          </p>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No jobs match your filters"
          description="Try clearing search or widening the dropdown filters."
        />
      ) : (
        <DataTable
          headers={[
            "Role",
            "Employer",
            "Location",
            "Type",
            "Pay range",
            "Posted",
            "Interested?",
            "",
          ]}
        >
          {filtered.map((job) => (
            <tr key={job.id} className="align-top">
              <td className="px-4 py-3">
                <p className="font-medium text-[var(--cf-ink)]">{job.title}</p>
                <p className="mt-1 max-w-md text-xs text-[var(--cf-muted)]">
                  {job.description}
                </p>
              </td>
              <td className="px-4 py-3">{job.employer}</td>
              <td className="px-4 py-3">{job.location}</td>
              <td className="px-4 py-3">
                <StatusPill label={job.employmentType} />
              </td>
              <td className="px-4 py-3">{job.payLabel}</td>
              <td className="px-4 py-3">{job.postedLabel}</td>
              <td className="px-4 py-3 text-center">
                <InterestedButton
                  jobId={job.id}
                  interested={job.interested}
                  jobTitle={job.title}
                />
              </td>
              <td className="px-4 py-3">
                {job.applied ? (
                  <StatusPill label="Applied" tone="good" />
                ) : (
                  <ApplyButton
                    jobId={job.id}
                    jobTitle={job.title}
                    profileResumeUrl={job.profileResumeUrl}
                  />
                )}
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
