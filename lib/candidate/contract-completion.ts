import type { Placement, Timesheet } from "@/lib/types/database";

export type ContractChecklistItem = {
  id: string;
  label: string;
  detail: string;
  complete: boolean;
};

export type ContractCompletion = {
  percent: number;
  doneCount: number;
  totalCount: number;
  items: ContractChecklistItem[];
  missing: ContractChecklistItem[];
};

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Placement lifecycle progress shown on candidate contract detail.
 * Started → working → timesheets → approved hours → pay → closed.
 */
export function getContractCompletion(
  placement: Pick<
    Placement,
    "start_date" | "end_date" | "status" | "pay_rate"
  >,
  timesheets: Pick<
    Timesheet,
    "status" | "hours_regular" | "hours_overtime"
  >[],
): ContractCompletion {
  const started =
    Boolean(placement.start_date) && placement.start_date <= todayIsoDate();
  const hasSubmitted = timesheets.some((t) =>
    ["submitted", "approved", "disputed", "rejected"].includes(t.status),
  );
  const hasApproved = timesheets.some((t) => t.status === "approved");
  const approvedHours = timesheets
    .filter((t) => t.status === "approved")
    .reduce(
      (sum, t) => sum + Number(t.hours_regular) + Number(t.hours_overtime),
      0,
    );
  const payRate = Number(placement.pay_rate ?? 0);
  const hasPay = hasApproved && approvedHours > 0 && payRate > 0;
  const working =
    placement.status === "active" ||
    hasSubmitted ||
    placement.status === "completed" ||
    placement.status === "cancelled";
  const closed =
    placement.status === "completed" || placement.status === "cancelled";

  const items: ContractChecklistItem[] = [
    {
      id: "started",
      label: "Contract started",
      detail: placement.start_date
        ? `Start date ${placement.start_date}`
        : "No start date on file",
      complete: started,
    },
    {
      id: "working",
      label: "Assignment underway",
      detail:
        placement.status === "active"
          ? "Placement is active"
          : hasSubmitted
            ? "Hours have been recorded"
            : closed
              ? "Assignment reached a final status"
              : "Waiting for work to begin",
      complete: working,
    },
    {
      id: "timesheets",
      label: "Timesheets submitted",
      detail: hasSubmitted
        ? `${timesheets.length} timesheet${timesheets.length === 1 ? "" : "s"} on file`
        : "No timesheets submitted yet",
      complete: hasSubmitted,
    },
    {
      id: "approved",
      label: "Hours approved",
      detail: hasApproved
        ? `${approvedHours.toFixed(1)} approved hours`
        : "No approved timesheets yet",
      complete: hasApproved,
    },
    {
      id: "pay",
      label: "Pay recorded",
      detail: hasPay
        ? `Est. $${(approvedHours * payRate).toFixed(2)} from approved hours`
        : payRate > 0
          ? "Waiting on approved hours for pay"
          : "Pay rate not set on this contract",
      complete: hasPay,
    },
    {
      id: "closed",
      label: "Contract closed",
      detail:
        placement.status === "completed"
          ? placement.end_date
            ? `Completed on ${placement.end_date}`
            : "Marked completed"
          : placement.status === "cancelled"
            ? "Assignment cancelled"
            : placement.end_date
              ? `Scheduled end ${placement.end_date}`
              : "Still open",
      complete: closed,
    },
  ];

  const doneCount = items.filter((i) => i.complete).length;
  const totalCount = items.length;
  const percent =
    totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);

  return {
    percent,
    doneCount,
    totalCount,
    items,
    missing: items.filter((i) => !i.complete),
  };
}
