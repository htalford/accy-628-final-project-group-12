import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import type { RecruiterInterview } from "@/lib/recruiter/types";

export function UpcomingInterviewsList({
  interviews,
}: {
  interviews: RecruiterInterview[];
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--cf-ink)]">
          Upcoming Interviews
        </h2>
        <Link
          href="/recruiter/interviews"
          className="text-xs font-medium text-[var(--cf-accent)] hover:underline"
        >
          View all
        </Link>
      </div>
      <div className="overflow-hidden rounded-xl border border-[var(--cf-border)] bg-white shadow-sm">
        {interviews.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-[var(--cf-muted)]">
            No upcoming interviews.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--cf-border)]">
            {interviews.map((item) => (
              <li
                key={item.id}
                className="px-4 py-3 transition hover:bg-[var(--cf-accent)]/[0.04]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-[var(--cf-ink)]">
                      {item.candidate}
                    </p>
                    <p className="text-xs text-[var(--cf-muted)]">
                      {item.company} · {item.position}
                    </p>
                  </div>
                  <StatusBadge status={item.type} />
                </div>
                <p className="mt-2 text-xs text-[var(--cf-muted)]">
                  {item.date} · {item.time}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
