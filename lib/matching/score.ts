/**
 * Automated job ↔ candidate matching (rules-based scoring).
 * Pure functions — safe for client or server.
 */

export type MatchBand = "strong" | "good" | "fair" | "low";

export type MatchCandidateInput = {
  skills?: string[];
  certifications?: string[];
  employmentType?: string | null;
  yearsExperience?: number | null;
  /** Free-text: resume, cover letter, profile notes */
  profileText?: string | null;
  /** City / region hints from placements or profile */
  locations?: string[];
  /** Current / past job titles */
  titles?: string[];
};

export type MatchJobInput = {
  title: string;
  description?: string | null;
  location?: string | null;
  employmentType?: string | null;
  requiredSkills?: string[];
  payMin?: number | null;
  payMax?: number | null;
};

export type MatchResult = {
  /** 0–100 composite */
  score: number;
  band: MatchBand;
  reasons: string[];
  skillHits: string[];
};

const STOP = new Set([
  "a",
  "an",
  "and",
  "or",
  "the",
  "to",
  "for",
  "of",
  "in",
  "on",
  "at",
  "with",
  "by",
  "from",
  "as",
  "is",
  "are",
  "be",
  "this",
  "that",
  "will",
  "our",
  "your",
  "you",
  "we",
  "us",
  "role",
  "job",
  "work",
  "team",
  "looking",
  "must",
  "able",
  "including",
  "experience",
  "years",
  "year",
  "etc",
  "support",
  "using",
  "such",
  "their",
  "they",
  "has",
  "have",
  "may",
  "can",
]);

/** Normalize free text into lowercase tokens (words ≥ 3 chars). */
export function tokenize(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s/-]/g, " ")
    .split(/[\s,/|;]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3 && !STOP.has(t));
}

export function splitSkills(
  value: string | string[] | null | undefined,
): string[] {
  if (value == null) return [];
  if (Array.isArray(value)) {
    return value
      .flatMap((s) => splitSkills(s))
      .filter(Boolean);
  }
  return value
    .split(/[,;|/]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2);
}

function uniq(tokens: string[]): string[] {
  return Array.from(new Set(tokens.map((t) => t.toLowerCase()).filter(Boolean)));
}

/** Deduplicate skills while keeping the first-seen display casing. */
function uniqPreserveCase(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const t = raw.trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

function normType(t: string | null | undefined): string {
  if (!t) return "";
  const s = t.toLowerCase();
  if (s.includes("perm")) return "permanent";
  if (s.includes("temp") || s.includes("hour") || s.includes("contract"))
    return "temp";
  return s;
}

function locationTokens(loc: string | null | undefined): string[] {
  if (!loc || loc === "—") return [];
  return tokenize(loc.replace(/\b(il|tx|wi|ca|ny|remote|hybrid|us)\b/gi, (m) => m));
}

/**
 * Whether the candidate has this required skill phrase.
 * Multi-word skills match as a whole phrase only (not “Accounts” / “Payable” / “Analyst”).
 * Single-token skills match as a whole skill tag/token only.
 */
function candidateHasSkill(
  skill: string,
  candSkillSet: Set<string>,
  profileBlob: string,
): boolean {
  const normalized = skill.toLowerCase().trim();
  if (!normalized) return false;

  if (candSkillSet.has(normalized)) return true;

  // Whole skill phrase appears in free text (resume, education, history).
  if (profileBlob.includes(normalized)) return true;

  // Allow simple punctuation variants: "3-way match" vs "3 way match"
  const loose = normalized.replace(/[-_/]+/g, " ").replace(/\s+/g, " ");
  if (loose !== normalized && profileBlob.includes(loose)) return true;
  if (candSkillSet.has(loose)) return true;

  return false;
}

/**
 * Score how well a candidate fits a job (0–100).
 * Skill hits are only the job’s required skill phrases — never title fragments.
 */
export function scoreMatch(
  job: MatchJobInput,
  candidate: MatchCandidateInput,
): MatchResult {
  const reasons: string[] = [];
  const skillHits: string[] = [];
  let score = 0;

  // Required skills only (comma list / array). Never job title word tokens.
  const requiredSkills = uniqPreserveCase(splitSkills(job.requiredSkills));

  const candSkills = uniqPreserveCase([
    ...splitSkills(candidate.skills),
    ...splitSkills(candidate.certifications),
  ]);
  const candSkillSet = new Set(candSkills.map((s) => s.toLowerCase()));
  const profileBlob = [
    candidate.profileText ?? "",
    candSkills.join(" "),
    (candidate.titles ?? []).join(" "),
  ]
    .join("\n")
    .toLowerCase();

  // --- Skills only (max 75) — drives match chips ---
  if (requiredSkills.length > 0) {
    for (const skill of requiredSkills) {
      if (candidateHasSkill(skill, candSkillSet, profileBlob)) {
        skillHits.push(skill);
      }
    }
    const ratio = skillHits.length / requiredSkills.length;
    score += Math.round(ratio * 75);
    if (skillHits.length > 0) {
      reasons.push(
        `${skillHits.length} of ${requiredSkills.length} required skill${requiredSkills.length === 1 ? "" : "s"} matched`,
      );
    } else {
      reasons.push("No required skills matched yet");
    }
  } else {
    // No skill list on the role — neutral mid band; no token chips.
    score += 30;
    reasons.push("No required skills listed for this role");
  }

  // --- Soft ranking signals (not shown as skill chips) ---
  const jobType = normType(job.employmentType);
  const candType = normType(candidate.employmentType);
  if (jobType && candType && jobType === candType) {
    score += 10;
  } else {
    score += 5;
  }

  const years = candidate.yearsExperience;
  if (years != null && years >= 5) score += 10;
  else if (years != null && years >= 2) score += 7;
  else if (years != null) score += 4;
  else score += 5;

  const jobLoc = locationTokens(job.location);
  if (
    !job.location ||
    job.location.toLowerCase().includes("remote") ||
    jobLoc.includes("remote")
  ) {
    score += 5;
  } else {
    const candLoc = uniq(
      (candidate.locations ?? []).flatMap((l) => locationTokens(l)),
    );
    if (jobLoc.some((t) => candLoc.includes(t) || profileBlob.includes(t))) {
      score += 5;
    } else {
      score += 2;
    }
  }

  // Clamp
  score = Math.max(0, Math.min(100, Math.round(score)));

  const band: MatchBand =
    score >= 70 ? "strong" : score >= 50 ? "good" : score >= 30 ? "fair" : "low";

  return {
    score,
    band,
    reasons: reasons.slice(0, 4),
    // Preserve original skill casing/order from the job request
    skillHits: skillHits.slice(0, 8),
  };
}

export function bandLabel(band: MatchBand): string {
  switch (band) {
    case "strong":
      return "Strong match";
    case "good":
      return "Good match";
    case "fair":
      return "Fair match";
    default:
      return "Low match";
  }
}

export function bandTone(
  band: MatchBand,
): "success" | "navy" | "warning" | "muted" {
  switch (band) {
    case "strong":
      return "success";
    case "good":
      return "navy";
    case "fair":
      return "warning";
    default:
      return "muted";
  }
}
