"use client";

import { bandLabel, type MatchBand } from "@/lib/matching/score";

const styles: Record<MatchBand, string> = {
  strong: "bg-emerald-50 text-emerald-800 border-emerald-200",
  good: "bg-[var(--cf-navy)]/10 text-[var(--cf-navy)] border-[var(--cf-navy)]/20",
  fair: "bg-amber-50 text-amber-900 border-amber-200",
  low: "bg-slate-100 text-slate-600 border-slate-200",
};

export function MatchScoreBadge({
  score,
  band,
  compact = false,
}: {
  score: number;
  band: MatchBand;
  compact?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold tabular-nums ${styles[band]}`}
      title={bandLabel(band)}
    >
      <span>{score}%</span>
      {!compact ? (
        <span className="font-medium opacity-90">{bandLabel(band)}</span>
      ) : null}
    </span>
  );
}

/** Chips for skills / keywords that contributed to a match score. */
export function MatchedSkills({
  skills,
  label = "Matched skills",
  emptyLabel = "No skill tags matched yet",
  className = "",
}: {
  skills?: string[] | null;
  label?: string;
  emptyLabel?: string;
  className?: string;
}) {
  const list = (skills ?? []).map((s) => s.trim()).filter(Boolean);
  if (list.length === 0) {
    if (!emptyLabel) return null;
    return (
      <p className={`text-[11px] text-[var(--cf-muted)] ${className}`}>
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className={className}>
      <p className="mb-1 text-[10px] font-semibold tracking-wide text-[var(--cf-muted)] uppercase">
        {label}
      </p>
      <ul className="flex flex-wrap gap-1">
        {list.map((skill) => (
          <li
            key={skill}
            className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-900"
          >
            {skill}
          </li>
        ))}
      </ul>
    </div>
  );
}
