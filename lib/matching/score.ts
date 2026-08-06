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
 * Score how well a candidate fits a job (0–100).
 * Reasons are short human strings for UI.
 */
export function scoreMatch(
  job: MatchJobInput,
  candidate: MatchCandidateInput,
): MatchResult {
  const reasons: string[] = [];
  const skillHits: string[] = [];
  let score = 0;

  const jobSkills = uniq([
    ...splitSkills(job.requiredSkills),
    ...tokenize(job.title),
  ]);
  // Prefer explicit required skills; description keywords fill gaps.
  const jobSkillSet = new Set(
    job.requiredSkills?.length
      ? uniq(splitSkills(job.requiredSkills))
      : jobSkills,
  );
  const jobDescTokens = new Set(tokenize(job.description));
  const jobTitleTokens = new Set(tokenize(job.title));

  const candSkills = uniq([
    ...splitSkills(candidate.skills),
    ...splitSkills(candidate.certifications),
  ]);
  const candSkillSet = new Set(candSkills);
  const candText = new Set([
    ...candSkills,
    ...tokenize(candidate.profileText),
    ...tokenize((candidate.titles ?? []).join(" ")),
  ]);

  // --- Skills (max 40) ---
  if (jobSkillSet.size > 0) {
    let hits = 0;
    for (const skill of jobSkillSet) {
      const parts = skill.split(/\s+/).filter((p) => p.length >= 3);
      const matched =
        candSkillSet.has(skill) ||
        candText.has(skill) ||
        parts.some((p) => candText.has(p) || candSkillSet.has(p));
      if (matched) {
        hits += 1;
        skillHits.push(skill);
      }
    }
    const ratio = hits / jobSkillSet.size;
    const skillScore = Math.round(ratio * 40);
    score += skillScore;
    if (hits > 0) {
      reasons.push(
        `${hits} of ${jobSkillSet.size} skill signal${jobSkillSet.size === 1 ? "" : "s"} matched`,
      );
    } else {
      reasons.push("No direct skill overlap yet");
    }
  } else {
    // Fall back to description keywords vs candidate profile text
    let hits = 0;
    const sample = Array.from(jobDescTokens).slice(0, 12);
    for (const t of sample) {
      if (candText.has(t)) {
        hits += 1;
        if (!skillHits.includes(t)) skillHits.push(t);
      }
    }
    const descScore = sample.length
      ? Math.round((hits / sample.length) * 30)
      : 10;
    score += descScore;
    if (hits > 0) reasons.push("Keywords in the posting match your profile");
  }

  // --- Title fit (max 25) ---
  const candTitles = new Set(tokenize((candidate.titles ?? []).join(" ")));
  let titleHits = 0;
  for (const t of jobTitleTokens) {
    if (candTitles.has(t) || candText.has(t) || candSkillSet.has(t)) {
      titleHits += 1;
      if (!skillHits.includes(t)) skillHits.push(t);
    }
  }
  if (jobTitleTokens.size > 0) {
    const titleScore = Math.round(
      (titleHits / jobTitleTokens.size) * 25,
    );
    score += titleScore;
    if (titleHits > 0) reasons.push("Title wording aligns with your background");
  } else {
    score += 5;
  }

  // --- Location (max 15) ---
  const jobLoc = locationTokens(job.location);
  const candLoc = uniq((candidate.locations ?? []).flatMap((l) => locationTokens(l)));
  if (jobLoc.length === 0) {
    score += 8;
    reasons.push("Location open / flexible");
  } else if (
    job.location?.toLowerCase().includes("remote") ||
    jobLoc.includes("remote")
  ) {
    score += 15;
    reasons.push("Remote-friendly role");
  } else {
    const locHits = jobLoc.filter(
      (t) => candLoc.includes(t) || candText.has(t),
    ).length;
    if (locHits > 0) {
      score += 15;
      reasons.push("Location looks compatible");
    } else if (candLoc.length === 0) {
      score += 6;
    } else {
      score += 2;
      reasons.push("Location may need review");
    }
  }

  // --- Employment type (max 10) ---
  const jobType = normType(job.employmentType);
  const candType = normType(candidate.employmentType);
  if (jobType && candType) {
    if (jobType === candType) {
      score += 10;
      reasons.push(
        jobType === "permanent" ? "Permanent type match" : "Temp/hourly type match",
      );
    } else {
      score += 3;
    }
  } else {
    score += 5;
  }

  // --- Experience years soft signal (max 10) ---
  const years = candidate.yearsExperience;
  if (years != null && years >= 0) {
    if (years >= 5) {
      score += 10;
      reasons.push("Solid experience level");
    } else if (years >= 2) {
      score += 7;
    } else {
      score += 4;
    }
  } else {
    score += 5;
  }

  // Clamp
  score = Math.max(0, Math.min(100, Math.round(score)));

  const band: MatchBand =
    score >= 70 ? "strong" : score >= 50 ? "good" : score >= 30 ? "fair" : "low";

  return {
    score,
    band,
    reasons: reasons.slice(0, 4),
    skillHits: skillHits.slice(0, 6),
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
