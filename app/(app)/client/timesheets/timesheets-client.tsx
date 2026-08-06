"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, THead, Th, Td } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/form";
import { ConfirmActionDialog } from "@/components/client-portal/confirm-action-dialog";
import { useToast } from "@/components/client-portal/toast";
import type { TimesheetWithDetails } from "@/lib/client-portal/types";
import {
  seedStatusTone,
  timesheetStatusLabel,
} from "@/lib/client-portal/labels";
import { paginate } from "@/lib/client-portal/pagination";
import { updateTimesheetStatusAction } from "@/app/actions/client-portal";

type PendingAction = {
  id: string;
  name: string;
  week: string;
  next: "approved" | "rejected";
};

export function TimesheetsClient({
  companyName,
  timesheets,
  employeeNames,
}: {
  companyName: string;
  timesheets: TimesheetWithDetails[];
  employeeNames: string[];
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const initialStatus = searchParams.get("status") ?? "All";
  const [week, setWeek] = useState("All");
  const [employee, setEmployee] = useState("All");
  const [status, setStatus] = useState(initialStatus);
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<PendingAction | null>(null);

  const weeks = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(timesheets.map((t) => t.week_ending_date.slice(0, 10))),
      ),
    ],
    [timesheets],
  );

  const filtered = timesheets.filter((t) => {
    const we = t.week_ending_date.slice(0, 10);
    return (
      (week === "All" || we === week) &&
      (employee === "All" || t.employee_name === employee) &&
      (status === "All" || t.status === status)
    );
  });

  const paged = paginate(filtered, page);

  function clearFilters() {
    setWeek("All");
    setEmployee("All");
    setStatus("All");
    setPage(1);
  }

  function openAction(
    t: TimesheetWithDetails,
    next: "approved" | "rejected",
  ) {
    setDialog({
      id: t.id,
      name: t.employee_name,
      week: t.week_ending_date.slice(0, 10),
      next,
    });
  }

  async function confirmAction(reason: string) {
    if (!dialog) return;
    const result = await updateTimesheetStatusAction(
      dialog.id,
      dialog.next,
      reason,
    );
    if (result.ok) {
      toast.push(result.message, "success");
      setDialog(null);
      router.refresh();
    } else {
      toast.push(result.message, "error");
    }
  }

  const hasFilters =
    week !== "All" || employee !== "All" || status !== "All";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Timesheets"
        description={`Live timesheets for ${companyName} placements (statuses match seed enums).`}
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Select
          value={week}
          onChange={(e) => {
            setWeek(e.target.value);
            setPage(1);
          }}
        >
          {weeks.map((w) => (
            <option key={w} value={w}>
              {w === "All" ? "All weeks" : `Week ending ${w}`}
            </option>
          ))}
        </Select>
        <Select
          value={employee}
          onChange={(e) => {
            setEmployee(e.target.value);
            setPage(1);
          }}
        >
          <option value="All">All employees</option>
          {employeeNames.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </Select>
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="All">All statuses</option>
          <option value="submitted">Submitted</option>
          <option value="approved">Approved</option>
          <option value="disputed">Disputed</option>
          <option value="rejected">Rejected</option>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={
            hasFilters
              ? "No timesheets match your filters"
              : "No timesheets yet"
          }
          description={
            hasFilters
              ? "Try clearing filters to see the full approval queue."
              : "When employees submit time for your placements, it will show up here."
          }
          action={
            hasFilters ? (
              <Button type="button" variant="secondary" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : null
          }
        />
      ) : (
        <>
          <Table>
            <THead>
              <tr>
                <Th>Employee</Th>
                <Th>Position</Th>
                <Th>Week Ending</Th>
                <Th>Hours</Th>
                <Th>Overtime</Th>
                <Th>Total</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </THead>
            <tbody>
              {paged.items.map((t) => (
                <tr key={t.id} className="hover:bg-[var(--cf-surface)]/60">
                  <Td className="font-medium">{t.employee_name}</Td>
                  <Td>{t.position_title}</Td>
                  <Td>{t.week_ending_date.slice(0, 10)}</Td>
                  <Td>{t.hours_regular}</Td>
                  <Td>{t.hours_overtime}</Td>
                  <Td>{t.hours_regular + t.hours_overtime}</Td>
                  <Td>
                    <Badge tone={seedStatusTone(t.status)}>
                      {timesheetStatusLabel(t.status)}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-1.5">
                      <Button
                        size="sm"
                        variant="secondary"
                        href={`/client/timesheets/${t.id}`}
                      >
                        View
                      </Button>
                      {t.status === "submitted" ? (
                        <>
                          <Button
                            size="sm"
                            variant="success"
                            type="button"
                            disabled={pending}
                            onClick={() => openAction(t, "approved")}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            type="button"
                            disabled={pending}
                            onClick={() => openAction(t, "rejected")}
                          >
                            Reject
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Pagination
            page={paged.page}
            totalPages={paged.totalPages}
            onPageChange={setPage}
          />
        </>
      )}

      <ConfirmActionDialog
        open={dialog != null}
        onClose={() => setDialog(null)}
        title={
          dialog?.next === "approved"
            ? "Approve timesheet?"
            : "Reject timesheet?"
        }
        description={
          dialog
            ? `${dialog.name} · week ending ${dialog.week}. This updates the live timesheet status in Supabase.`
            : ""
        }
        confirmLabel={dialog?.next === "approved" ? "Approve" : "Reject"}
        confirmVariant={dialog?.next === "approved" ? "success" : "danger"}
        requireReason={dialog?.next === "rejected"}
        reasonLabel={
          dialog?.next === "rejected"
            ? "Rejection reason (required)"
            : "Note (optional)"
        }
        busy={pending}
        onConfirm={async (reason) => {
          startTransition(async () => {
            await confirmAction(reason);
          });
        }}
      />
    </div>
  );
}
