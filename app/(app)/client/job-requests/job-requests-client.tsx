"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, THead, Th, Td } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/form";
import type { PortalJobRequest } from "@/lib/types/database";
import {
  jobRequestStatusLabel,
  seedStatusTone,
} from "@/lib/client-portal/labels";
import { paginate } from "@/lib/client-portal/pagination";

export function JobRequestsClient({
  initial,
}: {
  initial: PortalJobRequest[];
}) {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") ?? "All";
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("All");
  const [status, setStatus] = useState(() => {
    const s = initialStatus.toLowerCase().replaceAll(" ", "_");
    if (s === "open" || s === "in_progress" || s === "filled" || s === "closed")
      return s;
    if (initialStatus === "Open") return "open";
    return "All";
  });
  const [page, setPage] = useState(1);

  const departments = useMemo(
    () => ["All", ...Array.from(new Set(initial.map((j) => j.department)))],
    [initial],
  );

  const filtered = initial.filter((j) => {
    const matchesQ =
      !q ||
      j.title.toLowerCase().includes(q.toLowerCase()) ||
      (j.recruiter_name ?? "").toLowerCase().includes(q.toLowerCase());
    const matchesDept = dept === "All" || j.department === dept;
    const matchesStatus = status === "All" || j.status === status;
    return matchesQ && matchesDept && matchesStatus;
  });

  const paged = paginate(filtered, page);
  const hasFilters = q.trim() !== "" || dept !== "All" || status !== "All";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader
          title="Job Requests"
          description="Staffing requests for your company (stored on job_requests — separate from the public job board)."
        />
        <Button href="/client/job-requests/new">New Job Request</Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          className="sm:max-w-xs"
          placeholder="Search title or recruiter…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
        <Select
          value={dept}
          onChange={(e) => {
            setDept(e.target.value);
            setPage(1);
          }}
        >
          {departments.map((d) => (
            <option key={d} value={d}>
              {d === "All" ? "All departments" : d}
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
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="filled">Filled</option>
          <option value="closed">Closed</option>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={
            hasFilters
              ? "No job requests match your filters"
              : "No job requests yet"
          }
          description={
            hasFilters
              ? "Clear filters to see all requests."
              : "Create a staffing request for your recruiters."
          }
          action={
            hasFilters ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setQ("");
                  setDept("All");
                  setStatus("All");
                  setPage(1);
                }}
              >
                Clear filters
              </Button>
            ) : (
              <Button href="/client/job-requests/new">New Job Request</Button>
            )
          }
        />
      ) : (
        <>
          <Table>
            <THead>
              <tr>
                <Th>Job Title</Th>
                <Th>Department</Th>
                <Th>Positions</Th>
                <Th>Assigned Recruiter</Th>
                <Th>Date Requested</Th>
                <Th>Status</Th>
              </tr>
            </THead>
            <tbody>
              {paged.items.map((j) => (
                <tr key={j.id} className="hover:bg-[var(--cf-surface)]/60">
                  <Td>
                    <Link
                      href={`/client/job-requests/${j.id}`}
                      className="font-medium text-[var(--cf-navy)] hover:underline"
                    >
                      {j.title}
                    </Link>
                  </Td>
                  <Td>{j.department}</Td>
                  <Td>{j.positions}</Td>
                  <Td>{j.recruiter_name ?? "—"}</Td>
                  <Td>{j.created_at.slice(0, 10)}</Td>
                  <Td>
                    <Badge tone={seedStatusTone(j.status)}>
                      {jobRequestStatusLabel(j.status)}
                    </Badge>
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
    </div>
  );
}
