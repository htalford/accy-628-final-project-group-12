/**
 * Build MatchCandidateInput fields from candidate-portal employee profile data.
 */
import type { PreviousEmployment } from "@/lib/types/database";
import {
  type MatchCandidateInput,
  splitSkills,
} from "@/lib/matching/score";

function asEmployments(
  value: unknown,
): PreviousEmployment[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const o = (item ?? {}) as Record<string, unknown>;
    return {
      company: String(o.company ?? ""),
      title: String(o.title ?? ""),
      startDate: String(o.startDate ?? o.start_date ?? ""),
      endDate: String(o.endDate ?? o.end_date ?? ""),
      description: String(o.description ?? ""),
    };
  });
}

function yearsFromEmployments(jobs: PreviousEmployment[]): number | null {
  let months = 0;
  for (const job of jobs) {
    const start = Date.parse(job.startDate);
    if (Number.isNaN(start)) continue;
    const endRaw = job.endDate?.trim();
    const end =
      !endRaw || /present|current|now/i.test(endRaw)
        ? Date.now()
        : Date.parse(endRaw);
    if (Number.isNaN(end) || end < start) continue;
    months += (end - start) / (1000 * 60 * 60 * 24 * 30.44);
  }
  if (months <= 0) return null;
  return Math.max(0, Math.round(months / 12));
}

export type EmployeeProfileFields = {
  certifications?: string | null;
  employment_type?: string | null;
  education_background?: string | null;
  previous_employments?: PreviousEmployment[] | null | unknown;
  resume_text?: string | null;
  resume_url?: string | null;
};

/**
 * Full candidate matching signals from the live employee profile
 * (certs, education, past roles, extracted resume body).
 */
export function candidateInputFromProfile(
  employee: EmployeeProfileFields | null | undefined,
  extras?: {
    titles?: string[];
    locations?: string[];
    yearsExperience?: number | null;
    profileText?: string | null;
    skills?: string[];
  },
): MatchCandidateInput {
  const certs = splitSkills(employee?.certifications);
  const employments = asEmployments(employee?.previous_employments);
  const education = (employee?.education_background ?? "").trim();
  const resumeText = (employee?.resume_text ?? "").trim();

  const employmentTitles = employments
    .map((e) => e.title)
    .filter(Boolean);
  const employmentCompanies = employments
    .map((e) => e.company)
    .filter(Boolean);

  const employmentBlurb = employments
    .map((e) =>
      [e.title, e.company, e.startDate, e.endDate, e.description]
        .filter(Boolean)
        .join(" "),
    )
    .join("\n");

  const profileParts = [
    certs.length ? `Certifications: ${certs.join(", ")}` : "",
    education ? `Education: ${education}` : "",
    employmentBlurb ? `Experience:\n${employmentBlurb}` : "",
    resumeText ? `Resume:\n${resumeText}` : "",
    extras?.profileText ?? "",
  ].filter(Boolean);

  const years =
    extras?.yearsExperience ??
    yearsFromEmployments(employments);

  return {
    skills: uniqStrings([...(extras?.skills ?? []), ...certs]),
    certifications: certs,
    employmentType: employee?.employment_type ?? null,
    yearsExperience: years,
    profileText: profileParts.join("\n\n"),
    locations: extras?.locations ?? [],
    titles: uniqStrings([
      ...(extras?.titles ?? []),
      ...employmentTitles,
      ...employmentCompanies,
    ]),
  };
}

function uniqStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const t = v.trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

/** Pull profile-ish fields out of an application profile_snapshot. */
export function profileFieldsFromSnapshot(
  snap: Record<string, unknown> | null | undefined,
): EmployeeProfileFields | null {
  if (!snap) return null;
  return {
    certifications:
      snap.certifications == null ? null : String(snap.certifications),
    employment_type:
      snap.employment_type == null ? null : String(snap.employment_type),
    education_background:
      snap.education_background == null
        ? null
        : String(snap.education_background),
    previous_employments: asEmployments(snap.previous_employments),
    resume_text:
      snap.resume_text == null ? null : String(snap.resume_text),
    resume_url: snap.resume_url == null ? null : String(snap.resume_url),
  };
}
