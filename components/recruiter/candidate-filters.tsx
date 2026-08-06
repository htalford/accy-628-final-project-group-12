"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SearchInput } from "@/components/ui/search-input";
import { FilterSelect } from "@/components/ui/filter-select";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { MatchScoreBadge } from "@/components/matching/match-score-badge";
import { filterCandidates } from "@/lib/recruiter/filters";
import type { RecruiterCandidate } from "@/lib/recruiter/types";

export function CandidateFiltersPanel({
  statuses,
  locations,
  recruiters,
  skills,
  initialRows,
}: {
  statuses: string[];
  locations: string[];
  recruiters: string[];
  skills: string[];
  initialRows: RecruiterCandidate[];
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [experience, setExperience] = useState("all");
  const [skill, setSkill] = useState("all");
  const [location, setLocation] = useState("all");
  const [recruiter, setRecruiter] = useState("all");
  const [match, setMatch] = useState("all");

  const rows = useMemo(
    () =>
      filterCandidates(initialRows, {
        search,
        status,
        experience,
        skills: skill,
        location,
        recruiter,
        match,
      }),
    [
      initialRows,
      search,
      status,
      experience,
      skill,
      location,
      recruiter,
      match,
    ],
  );

  const needsReviewCount = useMemo(
    () =>
      initialRows.filter(
        (c) => c.matchPercent != null && c.matchPercent < 60,
      ).length,
    [initialRows],
  );

  return (
    <div className="space-y-4">
      {needsReviewCount > 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <span className="font-semibold">{needsReviewCount}</span> candidate
          {needsReviewCount === 1 ? "" : "s"} under 60% match — sorted to the top
          for recruiter review. Use the Match filter to focus on them.
        </div>
      ) : null}

      <div className="flex flex-col gap-3 rounded-xl border border-[var(--cf-border)] bg-white p-4 shadow-sm">
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search candidates, roles, or skills…"
        />
        <div className="flex flex-wrap gap-3">
          <FilterSelect
            label="Status"
            value={status}
            onChange={setStatus}
            options={[
              { value: "all", label: "All statuses" },
              ...statuses.map((s) => ({ value: s, label: s })),
            ]}
          />
          <FilterSelect
            label="Match"
            value={match}
            onChange={setMatch}
            options={[
              { value: "all", label: "All match scores" },
              { value: "under60", label: "Under 60% (needs review)" },
              { value: "60plus", label: "60% and above" },
            ]}
          />
          <FilterSelect
            label="Experience"
            value={experience}
            onChange={setExperience}
            options={[
              { value: "all", label: "All experience" },
              { value: "0-2", label: "0–2 years" },
              { value: "3-5", label: "3–5 years" },
              { value: "6+", label: "6+ years" },
            ]}
          />
          <FilterSelect
            label="Skills"
            value={skill}
            onChange={setSkill}
            options={[
              { value: "all", label: "All skills" },
              ...skills.map((s) => ({ value: s, label: s })),
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
            label="Recruiter"
            value={recruiter}
            onChange={setRecruiter}
            options={[
              { value: "all", label: "All recruiters" },
              ...recruiters.map((s) => ({ value: s, label: s })),
            ]}
          />
        </div>
      </div>

      <DataTable
        rows={rows}
        emptyMessage="No candidates match these filters."
        columns={[
          {
            key: "name",
            header: "Name",
            render: (row) => (
              <div>
                <p className="font-medium">{row.name}</p>
                <p className="text-xs text-[var(--cf-muted)]">{row.email}</p>
                {row.source === "job_interest" ? (
                  <p className="mt-0.5 text-[10px] font-medium tracking-wide text-amber-800 uppercase">
                    Interested · low match
                  </p>
                ) : null}
              </div>
            ),
          },
          {
            key: "position",
            header: "Position Applied",
            render: (row) => row.positionApplied,
          },
          {
            key: "match",
            header: "Match",
            render: (row) => {
              if (row.matchPercent == null || !row.matchBand) {
                return (
                  <span className="text-xs text-[var(--cf-muted)]">—</span>
                );
              }
              const needsReview = row.matchPercent < 60;
              return (
                <div className="space-y-1">
                  <MatchScoreBadge
                    score={row.matchPercent}
                    band={row.matchBand}
                    compact
                  />
                  {needsReview ? (
                    <p className="text-[10px] font-semibold tracking-wide text-amber-800 uppercase">
                      Needs review
                    </p>
                  ) : null}
                </div>
              );
            },
          },
          {
            key: "exp",
            header: "Experience",
            render: (row) => `${row.experienceYears} yrs`,
          },
          {
            key: "status",
            header: "Status",
            render: (row) => <StatusBadge status={row.status} />,
          },
          {
            key: "updated",
            header: "Last Updated",
            render: (row) => row.lastUpdated,
          },
          {
            key: "actions",
            header: "Actions",
            interactive: true,
            render: (row) => (
              <Link
                href={`/recruiter/candidates/${encodeURIComponent(row.id)}`}
                className="rounded-md bg-[var(--cf-navy)] px-2.5 py-1 text-xs font-medium text-white hover:bg-[var(--cf-navy-hover)]"
              >
                View
              </Link>
            ),
          },
        ]}
      />
    </div>
  );
}
