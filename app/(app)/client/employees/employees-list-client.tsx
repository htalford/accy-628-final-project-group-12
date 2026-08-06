"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Table, THead, Th, Td } from "@/components/ui/table";
import {
  formatMoney,
  placementStatusLabel,
  seedStatusTone,
} from "@/lib/client-portal/labels";
import { ChevronRight } from "lucide-react";

export type EmployeeListRow = {
  employeeId: string;
  placementId: string;
  name: string;
  title: string;
  status: string;
  startDate: string;
  placementType: string;
  billRate: number | null;
  payRate: number | null;
  hoursThisPeriod: number;
};

export function EmployeesListClient({
  companyName,
  rows,
}: {
  companyName: string;
  rows: EmployeeListRow[];
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        description={`People currently on assignment at ${companyName}. Click a name for full details.`}
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No active employees"
          description="When TalentQuest places people on assignments for your company, they will appear here."
          action={
            <Button href="/client/job-requests/new" variant="secondary">
              Submit a job request
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--cf-border)] bg-white shadow-sm">
          <Table>
            <THead>
              <tr>
                <Th>Employee</Th>
                <Th>Position</Th>
                <Th>Status</Th>
                <Th>Start</Th>
                <Th className="hidden sm:table-cell">Bill / Pay</Th>
                <Th className="w-10">
                  <span className="sr-only">Open</span>
                </Th>
              </tr>
            </THead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.placementId} className="hover:bg-[var(--cf-surface)]/60">
                  <Td>
                    <Link
                      href={`/client/employees/${e.employeeId}`}
                      className="font-medium text-[var(--cf-navy)] hover:underline"
                    >
                      {e.name}
                    </Link>
                  </Td>
                  <Td>
                    <Link
                      href={`/client/employees/${e.employeeId}`}
                      className="text-[var(--cf-ink)] hover:underline"
                    >
                      {e.title}
                    </Link>
                  </Td>
                  <Td>
                    <Badge tone={seedStatusTone(e.status)}>
                      {placementStatusLabel(e.status)}
                    </Badge>
                  </Td>
                  <Td className="text-sm tabular-nums">
                    {e.startDate.slice(0, 10)}
                  </Td>
                  <Td className="hidden text-sm sm:table-cell">
                    {e.billRate != null ? formatMoney(e.billRate) : "—"} /{" "}
                    {e.payRate != null ? formatMoney(e.payRate) : "—"}
                  </Td>
                  <Td>
                    <Link
                      href={`/client/employees/${e.employeeId}`}
                      className="inline-flex rounded-md p-1.5 text-[var(--cf-muted)] hover:bg-[var(--cf-surface)] hover:text-[var(--cf-navy)]"
                      aria-label={`View ${e.name}`}
                    >
                      <ChevronRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </div>
  );
}
