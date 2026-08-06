import {
  Briefcase,
  CalendarDays,
  UserRoundCheck,
  Users,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import type { DashboardMetrics } from "@/lib/recruiter/types";

/** Shared page/card copy so dashboard subtitles stay in sync with tabs. */
export const RECRUITER_PAGE_COPY = {
  jobOrders: {
    title: "Open job orders",
    subtitle: "Open positions and hiring progress",
  },
  candidates: {
    title: "Matched candidates",
    subtitle: "Applications with skill and cert fit scores",
  },
  interviews: {
    title: "Upcoming interviews",
    subtitle: "Scheduled next",
  },
  placements: {
    title: "Recent placements",
    /** Dashboard card subtitle */
    subtitle: "Starting soon or active",
    /** Placements This Month page subtitle */
    pageSubtitle: "Active, Completed, and Ended Placements",
  },
  messages: {
    title: "Messages",
    subtitle:
      "Conversations with Employers, Candidates, and Accounting. Deleted items stay in Deleted for 30 days.",
  },
} as const;

export function RecruiterSummaryCards({ metrics }: { metrics: DashboardMetrics }) {
  const { jobOrders, candidates, interviews, placements } = RECRUITER_PAGE_COPY;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label={jobOrders.title}
        value={String(metrics.openJobOrders)}
        description={jobOrders.subtitle}
        icon={<Briefcase className="h-4 w-4" />}
        href="/recruiter/job-orders"
      />
      <StatCard
        label={candidates.title}
        value={String(metrics.candidatesInPipeline)}
        description={candidates.subtitle}
        icon={<Users className="h-4 w-4" />}
        href="/recruiter/candidates"
      />
      <StatCard
        label={interviews.title}
        value={String(metrics.upcomingInterviews)}
        description={interviews.subtitle}
        icon={<CalendarDays className="h-4 w-4" />}
        href="/recruiter/interviews"
      />
      <StatCard
        label={placements.title}
        value={String(metrics.recentPlacements)}
        description={placements.subtitle}
        icon={<UserRoundCheck className="h-4 w-4" />}
        href="/recruiter/placements"
      />
    </div>
  );
}
