import {
  Briefcase,
  CalendarDays,
  UserRoundCheck,
  Users,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import type { DashboardMetrics } from "@/lib/recruiter/types";

export function RecruiterSummaryCards({ metrics }: { metrics: DashboardMetrics }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Open Job Orders"
        value={String(metrics.openJobOrders)}
        description="Roles from the job board and employer requests"
        icon={<Briefcase className="h-4 w-4" />}
        href="/recruiter/job-orders"
      />
      <StatCard
        label="Candidates in Pipeline"
        value={String(metrics.candidatesInPipeline)}
        description="Employee Applications"
        icon={<Users className="h-4 w-4" />}
        href="/recruiter/candidates"
      />
      <StatCard
        label="Upcoming Interviews"
        value={String(metrics.upcomingInterviews)}
        description="Scheduled next"
        icon={<CalendarDays className="h-4 w-4" />}
        href="/recruiter/interviews"
      />
      <StatCard
        label="Recent Placements"
        value={String(metrics.recentPlacements)}
        description="Starting soon or active"
        icon={<UserRoundCheck className="h-4 w-4" />}
        href="/recruiter/placements"
      />
    </div>
  );
}
