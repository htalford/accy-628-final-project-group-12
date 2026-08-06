"use client";

import { useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  CalendarPlus,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FilePlus2,
  GitBranch,
} from "lucide-react";
import type { ActivityEvent, ActivityKind } from "@/lib/recruiter/types";

const ICONS: Record<ActivityKind, typeof GitBranch> = {
  stage_moved: GitBranch,
  interview_scheduled: CalendarPlus,
  placement_completed: CheckCircle2,
  job_order_created: FilePlus2,
  offer_accepted: BriefcaseBusiness,
};

const DEFAULT_VISIBLE = 3;
const MAX_VISIBLE = 10;

function formatTimestamp(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ActivityTimeline({ events }: { events: ActivityEvent[] }) {
  const [expanded, setExpanded] = useState(false);

  const sorted = useMemo(
    () =>
      [...events]
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
        .slice(0, MAX_VISIBLE),
    [events],
  );

  const visible = expanded
    ? sorted
    : sorted.slice(0, DEFAULT_VISIBLE);
  const canExpand = sorted.length > DEFAULT_VISIBLE;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-[var(--cf-ink)]">
          Recent Activity
        </h2>
        {canExpand ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--cf-navy)] hover:underline"
          >
            {expanded ? (
              <>
                Show less <ChevronUp className="h-3.5 w-3.5" />
              </>
            ) : (
              <>
                Show more <ChevronDown className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        ) : null}
      </div>
      <div className="rounded-xl border border-[var(--cf-border)] bg-white p-4 shadow-sm">
        {visible.length === 0 ? (
          <p className="text-sm text-[var(--cf-muted)]">No recent activity.</p>
        ) : (
          <ol className="space-y-4">
            {visible.map((event, index) => {
              const Icon = ICONS[event.kind];
              return (
                <li key={event.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--cf-accent)]/10 text-[var(--cf-accent)]">
                      <Icon className="h-4 w-4" />
                    </span>
                    {index < visible.length - 1 ? (
                      <span className="mt-1 w-px flex-1 bg-[var(--cf-border)]" />
                    ) : null}
                  </div>
                  <div className="pb-2">
                    <p className="text-sm text-[var(--cf-ink)]">
                      {event.description}
                    </p>
                    <p className="mt-1 text-xs text-[var(--cf-muted)]">
                      {formatTimestamp(event.timestamp)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
}
