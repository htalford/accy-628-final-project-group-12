import Link from "next/link";
import { moneyExact } from "@/lib/accounting/format";
import type { AuditEvent } from "@/lib/accounting/audit";

export type { AuditEvent };

export function AuditTrailList({
  events,
  emptyMessage = "No audit events yet.",
}: {
  events: AuditEvent[];
  emptyMessage?: string;
}) {
  if (events.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-[var(--cf-muted)]">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ol className="relative ml-2 space-y-0 border-l border-[var(--cf-border)]">
      {events.map((event) => (
        <li key={event.id} className="relative pb-4 pl-5 last:pb-0">
          <span className="absolute top-1.5 -left-[5px] h-2.5 w-2.5 rounded-full border-2 border-[var(--cf-accent)] bg-white" />
          <Link
            href={event.href}
            className="block rounded-lg px-2 py-1.5 transition hover:bg-[var(--cf-surface)]"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-semibold text-[var(--cf-ink)]">
                {event.title}
              </p>
              <time className="text-xs text-[var(--cf-muted)]">{event.at}</time>
            </div>
            <p className="text-xs text-[var(--cf-muted)]">{event.detail}</p>
            {event.amount != null ? (
              <p className="mt-0.5 text-sm font-medium text-[var(--cf-ink)]">
                {moneyExact(event.amount)}
              </p>
            ) : null}
            <p className="mt-1 text-[11px] font-medium text-[var(--cf-ink)]">
              View related record →
            </p>
          </Link>
        </li>
      ))}
    </ol>
  );
}
