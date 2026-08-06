/**
 * Server helpers that load portal data and run automated matching.
 */
import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  candidateInputFromProfile,
  type EmployeeProfileFields,
} from "@/lib/matching/profile-from-employee";
import {
  type MatchBand,
  type MatchCandidateInput,
  type MatchJobInput,
  type MatchResult,
  scoreMatch,
  splitSkills,
} from "@/lib/matching/score";
import type { Employee, Job } from "@/lib/types/database";
import type { RecruiterCandidate, RecruiterJobOrder } from "@/lib/recruiter/types";

export type RankedJobMatch = {
  jobId: string;
  result: MatchResult;
};

export type RankedCandidateMatch = {
  candidateId: string;
  name: string;
  result: MatchResult;
  source?: string;
};

export {
  candidateInputFromProfile,
  profileFieldsFromSnapshot,
} from "@/lib/matching/profile-from-employee";

/**
 * Candidate matching signals from the candidate-portal employee row:
 * certifications, education, previous employment, and extracted resume text.
 */
export function candidateInputFromEmployee(
  employee:
    | (Pick<
        Employee,
        | "certifications"
        | "employment_type"
        | "first_name"
        | "last_name"
        | "education_background"
        | "previous_employments"
      > & {
        resume_text?: string | null;
      })
    | null,
  extras?: {
    titles?: string[];
    locations?: string[];
    yearsExperience?: number | null;
    profileText?: string | null;
    skills?: string[];
  },
): MatchCandidateInput {
  return candidateInputFromProfile(
    employee as EmployeeProfileFields | null,
    extras,
  );
}

export function jobInputFromPublicJob(
  job: Pick<
    Job,
    | "title"
    | "description"
    | "location"
    | "employment_type"
    | "pay_rate_min"
    | "pay_rate_max"
  >,
  requiredSkills: string[] = [],
): MatchJobInput {
  return {
    title: job.title,
    description: job.description,
    location: job.location,
    employmentType: job.employment_type,
    requiredSkills,
    payMin: job.pay_rate_min,
    payMax: job.pay_rate_max,
  };
}

export function jobInputFromRecruiterOrder(job: RecruiterJobOrder): MatchJobInput {
  const typeHint =
    job.contractSummary?.toLowerCase().includes("perm") ||
    job.description?.toLowerCase().includes("permanent")
      ? "permanent"
      : "temp";
  return {
    title: job.title,
    description: job.description ?? null,
    location: job.location,
    employmentType: typeHint,
    requiredSkills: job.requiredSkills ?? [],
    payMin: job.payRate,
    payMax: job.billRate,
  };
}

export function candidateInputFromRecruiter(
  c: RecruiterCandidate,
): MatchCandidateInput {
  return candidateInputFromProfile(
    {
      certifications: (c.skills ?? []).join(", "),
      employment_type: null,
      education_background: c.education && c.education !== "—" ? c.education : null,
      previous_employments: c.previousEmployments ?? null,
      resume_text: c.resumeText ?? null,
    },
    {
      skills: c.skills ?? [],
      titles: [c.positionApplied, c.jobTitle].filter(Boolean) as string[],
      locations: c.location ? [c.location] : [],
      yearsExperience: c.experienceYears,
      profileText: c.notes || null,
    },
  );
}

/** Rank open jobs for one candidate profile. */
export function rankJobsForCandidate(
  jobs: MatchJobInput[],
  jobIds: string[],
  candidate: MatchCandidateInput,
  options?: { minScore?: number; limit?: number },
): RankedJobMatch[] {
  const min = options?.minScore ?? 0;
  const limit = options?.limit ?? 50;
  const ranked: RankedJobMatch[] = [];
  for (let i = 0; i < jobs.length; i++) {
    const result = scoreMatch(jobs[i], candidate);
    if (result.score >= min) {
      ranked.push({ jobId: jobIds[i], result });
    }
  }
  ranked.sort((a, b) => b.result.score - a.result.score);
  return ranked.slice(0, limit);
}

/** Rank candidates for one job. */
export function rankCandidatesForJob(
  job: MatchJobInput,
  candidates: Array<{ id: string; name: string; input: MatchCandidateInput; source?: string }>,
  options?: { minScore?: number; limit?: number },
): RankedCandidateMatch[] {
  const min = options?.minScore ?? 0;
  const limit = options?.limit ?? 10;
  const ranked = candidates
    .map((c) => ({
      candidateId: c.id,
      name: c.name,
      source: c.source,
      result: scoreMatch(job, c.input),
    }))
    .filter((r) => r.result.score >= min)
    .sort((a, b) => b.result.score - a.result.score)
    .slice(0, limit);
  return ranked;
}

/**
 * Load skill tags for public.jobs when linked via job_requests.source_job_id.
 */
export async function skillsForPublicJobs(
  jobIds: string[],
): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (jobIds.length === 0) return map;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_requests")
    .select("source_job_id, skills")
    .in("source_job_id", jobIds);

  if (error) {
    // Column may not exist on all envs — fail soft.
    console.error("job_requests skills by source_job_id", error.message);
    return map;
  }

  for (const row of data ?? []) {
    const jid = row.source_job_id != null ? String(row.source_job_id) : "";
    if (!jid) continue;
    const skills = Array.isArray(row.skills)
      ? row.skills.map(String)
      : splitSkills(row.skills as string | null);
    if (skills.length) map.set(jid, skills);
  }
  return map;
}

export function matchBandCss(band: MatchBand): string {
  switch (band) {
    case "strong":
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    case "good":
      return "bg-[var(--cf-navy)]/10 text-[var(--cf-navy)] border-[var(--cf-navy)]/20";
    case "fair":
      return "bg-amber-50 text-amber-900 border-amber-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}
