"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, THead, Th, Td } from "@/components/ui/table";
import { ConfirmActionDialog } from "@/components/client-portal/confirm-action-dialog";
import { Breadcrumbs } from "@/components/client-portal/breadcrumbs";
import { useToast } from "@/components/client-portal/toast";
import type { TimesheetWithDetails } from "@/lib/client-portal/types";
import {
  seedStatusTone,
  timesheetStatusLabel,
} from "@/lib/client-portal/labels";
import { updateTimesheetStatusAction } from "@/app/actions/client-portal";

function splitDaily(
  regular: number,
  ot: number,
): { day: string; hours: number }[] {
  const base = regular / 5;
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return days.map((day, i) => {
    if (i < 5)
      return {
        day,
        hours: Number((base + (i === 2 ? ot : 0)).toFixed(2)),
      };
    return { day, hours: 0 };
  });
}

export function TimesheetDetailClient({
  timesheet,
}: {
  timesheet: TimesheetWithDetails;
}) {
  const t = timesheet;
  const daily = splitDaily(t.hours_regular, t.hours_overtime);
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [dialog, setDialog] = useState<"approved" | "rejected" | null>(null);

  async function run(next: "approved" | "rejected", reason: string) {
    const result = await updateTimesheetStatusAction(t.id, next, reason);
    if (result.ok) {
      toast.push(result.message, "success");
      setDialog(null);
      router.refresh();
    } else {
      toast.push(result.message, "error");
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Timesheets", href: "/client/timesheets" },
          {
            label: `${t.employee_name} · WE ${t.week_ending_date.slice(0, 10)}`,
          },
        ]}
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader title={t.employee_name} />
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={seedStatusTone(t.status)}>
            {timesheetStatusLabel(t.status)}
          </Badge>
          {t.status === "submitted" ? (
            <>
              <Button
                size="sm"
                variant="success"
                type="button"
                disabled={pending}
                onClick={() => setDialog("approved")}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="danger"
                type="button"
                disabled={pending}
                onClick={() => setDialog("rejected")}
              >
                Reject
              </Button>
            </>
          ) : null}
          <Button size="sm" variant="secondary" href="/client/timesheets">
            Back
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-xs font-medium tracking-wide text-[var(--cf-muted)] uppercase">
            Regular hours
          </p>
          <p className="mt-1 text-2xl font-semibold">{t.hours_regular}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium tracking-wide text-[var(--cf-muted)] uppercase">
            Overtime hours
          </p>
          <p className="mt-1 text-2xl font-semibold">{t.hours_overtime}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium tracking-wide text-[var(--cf-muted)] uppercase">
            Total hours
          </p>
          <p className="mt-1 text-2xl font-semibold">
            {t.hours_regular + t.hours_overtime}
          </p>
        </Card>
      </div>

      <Card>
        <CardTitle className="mb-3">Daily Hours (estimated split)</CardTitle>
        <p className="mb-3 text-xs text-[var(--cf-muted)]">
          Seed stores weekly regular + OT totals only; the daily breakdown is
          reconstructed for display.
        </p>
        <Table>
          <THead>
            <tr>
              {daily.map((d) => (
                <Th key={d.day}>{d.day}</Th>
              ))}
            </tr>
          </THead>
          <tbody>
            <tr>
              {daily.map((d) => (
                <Td key={d.day}>{d.hours}</Td>
              ))}
            </tr>
          </tbody>
        </Table>
      </Card>

      <Card>
        <CardTitle className="mb-3">Notes</CardTitle>
        <p className="text-sm text-[var(--cf-ink)]">
          Current status: <strong>{timesheetStatusLabel(t.status)}</strong>
          {t.bill_rate != null
            ? ` · placement bill rate $${t.bill_rate.toFixed(2)}/hr`
            : null}
          . Approving or rejecting writes status and any note to Supabase.
        </p>
        {t.employer_note ? (
          <p className="mt-3 rounded-lg bg-[var(--cf-surface)] px-3 py-2 text-sm text-[var(--cf-ink)]">
            <span className="font-medium">Employer note: </span>
            {t.employer_note}
          </p>
        ) : null}
      </Card>

      <ConfirmActionDialog
        open={dialog != null}
        onClose={() => setDialog(null)}
        title={
          dialog === "approved" ? "Approve timesheet?" : "Reject timesheet?"
        }
        description={`${t.employee_name} · week ending ${t.week_ending_date.slice(0, 10)}. Confirm to update the live record.`}
        confirmLabel={dialog === "approved" ? "Approve" : "Reject"}
        confirmVariant={dialog === "approved" ? "success" : "danger"}
        requireReason={dialog === "rejected"}
        reasonLabel={
          dialog === "rejected"
            ? "Rejection reason (required)"
            : "Note (optional)"
        }
        busy={pending}
        onConfirm={async (reason) => {
          if (!dialog) return;
          startTransition(async () => {
            await run(dialog, reason);
          });
        }}
      />
    </div>
  );
}
