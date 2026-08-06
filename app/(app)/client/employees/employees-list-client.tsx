"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
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
  endDate?: string | null;
  placementType: string;
  billRate: number | null;
  payRate: number | null;
  hoursThisPeriod: number;
};

export function EmployeesListClient({
  rows,
}: {
  rows: EmployeeListRow[];
}) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");

  const filtered = useMemo(() => {
    return rows.filter((e) => {
      const matchesQ =
        !q ||
        e.name.toLowerCase().includes(q.toLowerCase()) ||
        e.title.toLowerCase().includes(q.toLowerCase());
      const matchesStatus =
        status === "All" ||
        e.status === status ||
        (status === "active" &&
          (e.status === "active" || e.status === "at_risk"));
      return matchesQ && matchesStatus;
    });
  }, [rows, q, status]);

  return (
    <div className="space-y-6">
      <PageHeader title="Employees" />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchInput
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search employees…"
          aria-label="Search employees"
          className="sm:max-w-xs"
        />
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="sm:max-w-[12rem]"
          aria-label="Filter by status"
        >
          <option value="All">All statuses</option>
          <option value="active">Active (incl. at risk)</option>
          <option value="at_risk">At Risk</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={rows.length === 0 ? "No employees yet" : "No matching employees"}
          description={
            rows.length === 0
              ? "When TalentQuest places people on assignments for your company, they will appear here."
              : "Try a different search or status filter."
          }
          action={
            rows.length === 0 ? (
              <Button href="/client/job-requests/new" variant="secondary">
                Submit a job request
              </Button>
            ) : undefined
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
              {filtered.map((e) => (
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
