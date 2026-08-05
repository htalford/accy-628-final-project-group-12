import { notFound } from "next/navigation";
import { getTimesheetForClient } from "@/lib/client-portal/queries";
import { TimesheetDetailClient } from "./timesheet-detail-client";

export default async function TimesheetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTimesheetForClient(id);
  if (!t) notFound();
  return <TimesheetDetailClient timesheet={t} />;
}
