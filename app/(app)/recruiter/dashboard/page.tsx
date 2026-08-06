import {
  getDashboardMetrics,
  listRecentActivity,
} from "@/lib/recruiter/data";
import { getAppUser } from "@/lib/auth/get-app-user";
import { RecruiterSummaryCards } from "@/components/recruiter/summary-cards";
import { ActivityTimeline } from "@/components/recruiter/activity-timeline";

export default async function RecruiterDashboardPage() {
  const user = await getAppUser();
  const name = user?.name || "Recruiter";
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const [metrics, activity] = await Promise.all([
    getDashboardMetrics(),
    listRecentActivity(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--cf-ink)]">
          Welcome back, {name.split(" ")[0]}!
        </h1>
        <p className="mt-1 text-sm text-[var(--cf-muted)]">{today}</p>
      </div>

      <RecruiterSummaryCards metrics={metrics} />

      <ActivityTimeline events={activity} />
    </div>
  );
}
