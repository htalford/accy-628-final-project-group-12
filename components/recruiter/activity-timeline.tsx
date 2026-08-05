import {
  BriefcaseBusiness,
  CalendarPlus,
  CheckCircle2,
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
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-[var(--cf-ink)]">
        Recent Activity
      </h2>
      <div className="rounded-xl border border-[var(--cf-border)] bg-white p-4 shadow-sm">
        <ol className="space-y-4">
          {events.map((event, index) => {
            const Icon = ICONS[event.kind];
            return (
              <li key={event.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--cf-accent)]/10 text-[var(--cf-accent)]">
                    <Icon className="h-4 w-4" />
                  </span>
                  {index < events.length - 1 ? (
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
      </div>
    </section>
  );
}
