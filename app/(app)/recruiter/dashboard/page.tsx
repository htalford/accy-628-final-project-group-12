import {
  getDashboardMetrics,
  listRecentActivity,
  listRecentJobOrders,
  listUpcomingInterviews,
} from "@/lib/recruiter/data";
import { getAppUser } from "@/lib/auth/get-app-user";
import { RecruiterSummaryCards } from "@/components/recruiter/summary-cards";
import { RecentJobOrdersTable } from "@/components/recruiter/recent-job-orders-table";
import { UpcomingInterviewsList } from "@/components/recruiter/upcoming-interviews-list";
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

  const [metrics, jobOrders, interviews, activity] = await Promise.all([
    getDashboardMetrics(),
    listRecentJobOrders(),
    listUpcomingInterviews(),
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

      <div className="grid gap-6 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <RecentJobOrdersTable rows={jobOrders} />
        </div>
        <div className="xl:col-span-2">
          <UpcomingInterviewsList interviews={interviews} />
        </div>
      </div>

      <ActivityTimeline events={activity} />
    </div>
  );
}
