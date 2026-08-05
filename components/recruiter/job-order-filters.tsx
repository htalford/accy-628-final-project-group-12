"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SearchInput } from "@/components/ui/search-input";
import { FilterSelect } from "@/components/ui/filter-select";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { filterJobOrders } from "@/lib/recruiter/filters";
import type { RecruiterJobOrder } from "@/lib/recruiter/types";

export function JobOrderFiltersPanel({
  clients,
  statuses,
  locations,
  priorities,
  initialRows,
}: {
  clients: string[];
  statuses: string[];
  locations: string[];
  priorities: string[];
  initialRows: RecruiterJobOrder[];
}) {
  const [search, setSearch] = useState("");
  const [client, setClient] = useState("all");
  const [status, setStatus] = useState("all");
  const [location, setLocation] = useState("all");
  const [priority, setPriority] = useState("all");

  const rows = useMemo(
    () =>
      filterJobOrders(initialRows, {
        search,
        client,
        status,
        location,
        priority,
      }),
    [initialRows, search, client, status, location, priority],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-[var(--cf-border)] bg-white p-4 shadow-sm">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search job titles, clients, or locations…"
        />
        <div className="flex flex-wrap gap-3">
          <FilterSelect
            label="Client"
            value={client}
            onChange={setClient}
            options={[
              { value: "all", label: "All clients" },
              ...clients.map((s) => ({ value: s, label: s })),
            ]}
          />
          <FilterSelect
            label="Status"
            value={status}
            onChange={setStatus}
            options={[
              { value: "all", label: "All statuses" },
              ...statuses.map((s) => ({ value: s, label: s })),
            ]}
          />
          <FilterSelect
            label="Location"
            value={location}
            onChange={setLocation}
            options={[
              { value: "all", label: "All locations" },
              ...locations.map((s) => ({ value: s, label: s })),
            ]}
          />
          <FilterSelect
            label="Priority"
            value={priority}
            onChange={setPriority}
            options={[
              { value: "all", label: "All priorities" },
              ...priorities.map((s) => ({ value: s, label: s })),
            ]}
          />
        </div>
      </div>

      <DataTable
        rows={rows}
        emptyMessage="No job orders match these filters."
        columns={[
          {
            key: "title",
            header: "Job Title",
            interactive: true,
            render: (row) => (
              <Link
                href={`/recruiter/job-orders/${row.id}`}
                className="font-medium text-[var(--cf-navy)] hover:underline"
              >
                {row.title}
              </Link>
            ),
          },
          {
            key: "client",
            header: "Client",
            interactive: true,
            render: (row) =>
              row.clientId ? (
                <Link
                  href={`/recruiter/clients/${row.clientId}`}
                  className="font-medium text-[var(--cf-navy)] hover:underline"
                >
                  {row.client}
                </Link>
              ) : (
                row.client
              ),
          },
          { key: "location", header: "Location", render: (row) => row.location },
          {
            key: "open",
            header: "Open Positions",
            render: (row) => row.openPositions,
          },
          {
            key: "filled",
            header: "Filled Positions",
            render: (row) => row.filledPositions,
          },
          {
            key: "priority",
            header: "Priority",
            render: (row) => <StatusBadge status={row.priority} />,
          },
          {
            key: "status",
            header: "Status",
            render: (row) => <StatusBadge status={row.status} />,
          },
          {
            key: "actions",
            header: "Actions",
            interactive: true,
            render: (row) => (
              <Link
                href={`/recruiter/job-orders/${row.id}`}
                className="rounded-md bg-[var(--cf-navy)] px-2.5 py-1 text-xs font-medium text-white hover:bg-[var(--cf-navy-hover)]"
              >
                View
              </Link>
            ),
          },
        ]}
      />
    </div>
  );
}
