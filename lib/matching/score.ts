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
  /** Required certification labels from the job request */
  requiredCertifications?: string[];
  payMin?: number | null;
  payMax?: number | null;
};

export type MatchResult = {
  /** 0–100 composite */
  score: number;
  band: MatchBand;
  reasons: string[];
  skillHits: string[];
  /** Required certifications that matched */
  certHits: string[];
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

/** Fluff words common in skill labels that should not be required for a hit. */
const SKILL_FILLER = new Set([
  ...STOP,
  "strong",
  "good",
  "great",
  "excellent",
  "solid",
  "proven",
  "basic",
  "advanced",
  "working",
  "knowledge",
  "proficient",
  "proficiency",
  "skilled",
  "skill",
  "skills",
  "ability",
  "abilities",
  "capable",
  "effective",
  "highly",
  "very",
  "well",
  "required",
  "preferred",
  "detail",
  "oriented",
  "driven",
  "level",
  "deep",
  "high",
  "using",
  "use",
  "hands",
  "on",
  "related",
  "general",
]);

/** Light stemming so manage/management/managing align. */
function lightStem(token: string): string {
  let t = token.toLowerCase();
  if (t.length <= 3) return t;
  if (t.endsWith("ing") && t.length > 5) t = t.slice(0, -3);
  else if (t.endsWith("ment") && t.length > 6) t = t.slice(0, -4);
  else if (t.endsWith("tion") && t.length > 6) t = t.slice(0, -4);
  else if (t.endsWith("sion") && t.length > 6) t = t.slice(0, -4);
  else if (t.endsWith("ies") && t.length > 4) t = `${t.slice(0, -3)}y`;
  else if (t.endsWith("es") && t.length > 4) t = t.slice(0, -2);
  else if (t.endsWith("s") && t.length > 4 && !t.endsWith("ss")) t = t.slice(0, -1);
  return t;
}

/**
 * Concept aliases: if the required skill matches `when`, any of `phrases`
 * (or stemmed token sets) can satisfy the skill as a looser hit.
 */
const SKILL_ALIASES: Array<{ when: RegExp; phrases: string[] }> = [
  {
    when: /time\s*manage|timekeep|priorit|deadline|punctual/,
    phrases: [
      "time management",
      "manage time",
      "good with time",
      "great with time",
      "on time",
      "punctual",
      "prioritize",
      "prioritise",
      "prioritization",
      "meet deadlines",
      "deadlines",
      "timekeeping",
      "organized",
      "organised",
    ],
  },
  {
    when: /communicat|interpersonal|verbal|written/,
    phrases: [
      "communication",
      "communicate",
      "communicator",
      "verbal",
      "written communication",
      "interpersonal",
      "public speaking",
      "presentation",
      "people skills",
      "customer facing",
    ],
  },
  {
    when: /customer\s*service|client\s*service|hospitality/,
    phrases: [
      "customer service",
      "client service",
      "customer facing",
      "client facing",
      "hospitality",
      "guest service",
      "help desk",
      "front desk",
    ],
  },
  {
    when: /\bexcel\b|spreadsheet|microsoft\s*excel/,
    phrases: [
      "excel",
      "ms excel",
      "microsoft excel",
      "spreadsheet",
      "spreadsheets",
      "vlookup",
      "pivot table",
      "pivot tables",
    ],
  },
  {
    when: /quickbooks|bookkeep|gaap|reconcil|journal\s*entr|accounts\s*receivable|accounts\s*payable|\bap\b|\bar\b/,
    phrases: [
      "quickbooks",
      "bookkeeping",
      "bookkeeper",
      "gaap",
      "reconciliation",
      "reconciliations",
      "journal entries",
      "journal entry",
      "accounts receivable",
      "accounts payable",
      "a/r",
      "a/p",
      "ap",
      "ar",
      "invoice processing",
      "invoicing",
    ],
  },
  {
    when: /forklift|pick.?pack|rf\s*scanner|warehouse|shipping|inventory/,
    phrases: [
      "forklift",
      "fork lift",
      "pick pack",
      "pick/pack",
      "rf scanner",
      "scanner",
      "warehouse",
      "shipping",
      "receiving",
      "inventory",
      "osha",
    ],
  },
  {
    when: /\btms\b|routing|freight|carrier|logistics/,
    phrases: [
      "tms",
      "transportation management",
      "routing",
      "freight",
      "carrier",
      "logistics",
      "dispatch",
      "shipping coordination",
    ],
  },
  {
    when: /teamwork|team\s*player|collaborat/,
    phrases: [
      "teamwork",
      "team player",
      "collaboration",
      "collaborate",
      "works well with others",
      "cross functional",
    ],
  },
  {
    when: /problem.?solv|critical\s*think|troubleshoot/,
    phrases: [
      "problem solving",
      "problem-solver",
      "troubleshoot",
      "troubleshooting",
      "critical thinking",
      "root cause",
    ],
  },
  {
    when: /attention\s*to\s*detail|detail.?orient/,
    phrases: [
      "attention to detail",
      "detail oriented",
      "detail-oriented",
      "meticulous",
      "accurate",
      "accuracy",
    ],
  },
  {
    when: /microsoft\s*office|ms\s*office|office\s*suite/,
    phrases: [
      "microsoft office",
      "ms office",
      "office 365",
      "word",
      "powerpoint",
      "outlook",
      "excel",
    ],
  },
];

function normalizePhrase(s: string): string {
  return s
    .toLowerCase()
    .replace(/[-_/]+/g, " ")
    .replace(/[^a-z0-9+#.\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function significantSkillTokens(skill: string): string[] {
  return normalizePhrase(skill)
    .split(/\s+/)
    .map(lightStem)
    .filter((t) => t.length >= 3 && !SKILL_FILLER.has(t) && !STOP.has(t));
}

function tokenInBlob(
  token: string,
  blob: string,
  blobTokenStems: Set<string>,
): boolean {
  const stem = lightStem(token);
  if (blobTokenStems.has(stem)) return true;
  if (blobTokenStems.has(token)) return true;
  // Whole-word-ish match so "ap" does not hit random words, but "excel" does.
  if (token.length <= 2) {
    return new RegExp(`(^|[^a-z0-9])${token}([^a-z0-9]|$)`, "i").test(blob);
  }
  return (
    blob.includes(token) ||
    (stem !== token && blob.includes(stem))
  );
}

/**
 * Whether the candidate has this required skill.
 * Display chips always use the full required label; matching is looser:
 * exact phrase, punctuation variants, synonym/alias phrases, or enough
 * meaningful word stems from the skill appearing in profile text.
 */
function candidateHasSkill(
  skill: string,
  candSkillSet: Set<string>,
  profileBlob: string,
  blobTokenStems: Set<string>,
): boolean {
  const normalized = normalizePhrase(skill);
  if (!normalized) return false;

  if (candSkillSet.has(normalized) || candSkillSet.has(skill.toLowerCase().trim())) {
    return true;
  }

  const blob = normalizePhrase(profileBlob);
  if (blob.includes(normalized)) return true;

  // Candidate listed a skill that contains or is contained by this requirement.
  for (const listed of candSkillSet) {
    const n = normalizePhrase(listed);
    if (!n) continue;
    if (n.includes(normalized) || normalized.includes(n)) {
      // Avoid tiny fragments creating false positives ("ap" in "happy")
      if (n.length >= 3 && normalized.length >= 3) return true;
    }
  }

  // Concept aliases (similar wording / soft skills)
  for (const alias of SKILL_ALIASES) {
    if (!alias.when.test(normalized)) continue;
    for (const phrase of alias.phrases) {
      const p = normalizePhrase(phrase);
      if (!p) continue;
      if (blob.includes(p) || candSkillSet.has(p)) return true;
      // All stems of a short alias phrase present
      const parts = significantSkillTokens(p);
      if (
        parts.length > 0 &&
        parts.every((part) => tokenInBlob(part, blob, blobTokenStems))
      ) {
        return true;
      }
    }
  }

  // Significant-token overlap: drop fluff ("strong"), match remaining stems.
  const needed = significantSkillTokens(normalized);
  if (needed.length === 0) {
    // Skill was only fluff + tiny words — fall back to any raw token ≥ 3 chars
    const raw = normalized.split(/\s+/).filter((t) => t.length >= 3);
    return raw.some((t) => tokenInBlob(t, blob, blobTokenStems));
  }

  if (needed.length === 1) {
    return tokenInBlob(needed[0], blob, blobTokenStems);
  }

  const hits = needed.filter((t) => tokenInBlob(t, blob, blobTokenStems)).length;
  // Looser multi-word: half (rounded up) of meaningful tokens is enough.
  // e.g. "Strong time management" → time + manage; "good with time" hits time → 1/2 counts
  // for 3+ tokens require at least 2 to reduce noise.
  const threshold =
    needed.length === 2 ? 1 : Math.max(2, Math.ceil(needed.length * 0.5));
  return hits >= threshold;
}

/**
 * Score how well a candidate fits a job (0–100).
 * Skills and certifications are scored separately against job request lists.
 */
export function scoreMatch(
  job: MatchJobInput,
  candidate: MatchCandidateInput,
): MatchResult {
  const reasons: string[] = [];
  const skillHits: string[] = [];
  const certHits: string[] = [];
  let score = 0;

  const requiredSkills = uniqPreserveCase(splitSkills(job.requiredSkills));
  const requiredCerts = uniqPreserveCase(
    splitSkills(job.requiredCertifications),
  );

  const listedSkills = uniqPreserveCase(splitSkills(candidate.skills));
  const listedCerts = uniqPreserveCase(splitSkills(candidate.certifications));
  // Skills set = skills tags + cert labels (certs often double as skill signals)
  const candSkillSet = new Set(
    [...listedSkills, ...listedCerts].flatMap((s) => {
      const n = normalizePhrase(s);
      return n ? [n, s.toLowerCase().trim()] : [];
    }),
  );
  // Cert set prefers explicit certification strings (still allows skill overlaps)
  const candCertSet = new Set(
    listedCerts.flatMap((s) => {
      const n = normalizePhrase(s);
      return n ? [n, s.toLowerCase().trim()] : [];
    }),
  );
  const profileBlob = [
    candidate.profileText ?? "",
    listedSkills.join(" "),
    listedCerts.join(" "),
    (candidate.titles ?? []).join(" "),
  ].join("\n");
  const blobTokenStems = new Set(
    tokenize(profileBlob).map(lightStem).filter(Boolean),
  );

  const hasSkills = requiredSkills.length > 0;
  const hasCerts = requiredCerts.length > 0;
  // Split points: skills / certs share the bulk of the score when both are set.
  const skillPoints = hasSkills && hasCerts ? 45 : hasSkills ? 70 : 0;
  const certPoints = hasSkills && hasCerts ? 30 : hasCerts ? 70 : 0;
  const softCap = hasSkills || hasCerts ? 25 : 100;

  // --- Skills ---
  if (hasSkills) {
    for (const skill of requiredSkills) {
      if (candidateHasSkill(skill, candSkillSet, profileBlob, blobTokenStems)) {
        skillHits.push(skill);
      }
    }
    const ratio = skillHits.length / requiredSkills.length;
    score += Math.round(ratio * skillPoints);
    if (skillHits.length > 0) {
      reasons.push(
        `${skillHits.length} of ${requiredSkills.length} required skill${requiredSkills.length === 1 ? "" : "s"} matched`,
      );
    } else {
      reasons.push("No required skills matched yet");
    }
  }

  // --- Certifications (separate chips + score) ---
  if (hasCerts) {
    for (const cert of requiredCerts) {
      // Prefer certification field; allow profile/resume text & skill tags as backup.
      if (
        candidateHasSkill(cert, candCertSet, profileBlob, blobTokenStems) ||
        candidateHasSkill(cert, candSkillSet, profileBlob, blobTokenStems)
      ) {
        certHits.push(cert);
      }
    }
    const ratio = certHits.length / requiredCerts.length;
    score += Math.round(ratio * certPoints);
    if (certHits.length > 0) {
      reasons.push(
        `${certHits.length} of ${requiredCerts.length} required certification${requiredCerts.length === 1 ? "" : "s"} matched`,
      );
    } else {
      reasons.push("No required certifications matched yet");
    }
  }

  if (!hasSkills && !hasCerts) {
    score += 40;
    reasons.push("No skills or certifications listed for this role");
  }

  // --- Soft ranking signals ---
  let soft = 0;
  const jobType = normType(job.employmentType);
  const candType = normType(candidate.employmentType);
  if (jobType && candType && jobType === candType) soft += 10;
  else soft += 5;

  const years = candidate.yearsExperience;
  if (years != null && years >= 5) soft += 10;
  else if (years != null && years >= 2) soft += 7;
  else if (years != null) soft += 4;
  else soft += 5;

  const jobLoc = locationTokens(job.location);
  const blob = normalizePhrase(profileBlob);
  if (
    !job.location ||
    job.location.toLowerCase().includes("remote") ||
    jobLoc.includes("remote")
  ) {
    soft += 5;
  } else {
    const candLoc = uniq(
      (candidate.locations ?? []).flatMap((l) => locationTokens(l)),
    );
    if (jobLoc.some((t) => candLoc.includes(t) || blob.includes(t))) soft += 5;
    else soft += 2;
  }

  // Scale soft block to remaining points so total max is 100
  const softMaxNatural = 25;
  score += Math.round((Math.min(soft, softMaxNatural) / softMaxNatural) * softCap);

  // Clamp
  score = Math.max(0, Math.min(100, Math.round(score)));

  const band: MatchBand =
    score >= 70 ? "strong" : score >= 50 ? "good" : score >= 30 ? "fair" : "low";

  return {
    score,
    band,
    reasons: reasons.slice(0, 4),
    skillHits: skillHits.slice(0, 8),
    certHits: certHits.slice(0, 8),
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
