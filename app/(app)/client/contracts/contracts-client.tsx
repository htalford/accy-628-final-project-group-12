"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, THead, Th, Td } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/form";
import { PinContractButton } from "@/components/portal-pins/pin-contract-button";
import type { PlacementWithEmployee } from "@/lib/client-portal/types";
import {
  placementPositionTitle,
  placementStatusLabel,
  placementTypeLabel,
  seedStatusTone,
  shortPlacementNumber,
} from "@/lib/client-portal/labels";
import { paginate } from "@/lib/client-portal/pagination";

export function ContractsClient({
  companyName,
  placements,
}: {
  companyName: string;
  placements: PlacementWithEmployee[];
}) {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") ?? "All";
  const [q, setQ] = useState("");
  const [status, setStatus] = useState(
    initialStatus === "active" ? "active" : initialStatus,
  );
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return placements.filter((p) => {
      const name = p.employee
        ? `${p.employee.first_name} ${p.employee.last_name}`
        : "";
      const title = placementPositionTitle(p.title, p.placement_type);
      const number = shortPlacementNumber(p.id);
      const matchesQ =
        !q ||
        name.toLowerCase().includes(q.toLowerCase()) ||
        title.toLowerCase().includes(q.toLowerCase()) ||
        number.toLowerCase().includes(q.toLowerCase()) ||
        p.id.toLowerCase().includes(q.toLowerCase());
      const matchesStatus =
        status === "All" ||
        p.status === status ||
        (status === "active" &&
          (p.status === "active" || p.status === "at_risk"));
      return matchesQ && matchesStatus;
    });
  }, [placements, q, status]);

  const paged = paginate(filtered, page);
  const hasFilters = q.trim() !== "" || status !== "All";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contracts"
        description={`${companyName} · same placements and contract numbers as the Accounting portal.`}
      />
      <div className="flex flex-col gap-3 sm:flex-row">
        <SearchInput
          className="sm:max-w-xs"
          placeholder="Search contract #, employee, title…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
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
          title={
            hasFilters
              ? "No contracts match your filters"
              : "No contracts for this client"
          }
          description={
            hasFilters
              ? "Adjust search or status to widen results."
              : "Placements that accounting records for your company will appear here."
          }
          action={
            hasFilters ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setQ("");
                  setStatus("All");
                  setPage(1);
                }}
              >
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
                <Th>Contract #</Th>
                <Th>Position Title</Th>
                <Th>Employee</Th>
                <Th>Start</Th>
                <Th>End</Th>
                <Th>Type</Th>
                <Th>Status</Th>
                <Th className="w-12 text-center">Pin</Th>
              </tr>
            </THead>
            <tbody>
              {paged.items.map((p) => {
                const name = p.employee
                  ? `${p.employee.first_name} ${p.employee.last_name}`
                  : "—";
                const number = shortPlacementNumber(p.id);
                const title = placementPositionTitle(p.title, p.placement_type);
                return (
                  <tr key={p.id} className="hover:bg-[var(--cf-surface)]/60">
                    <Td>
                      <Link
                        href={`/client/contracts/${p.id}`}
                        className="font-mono text-xs font-medium text-[var(--cf-navy)] hover:underline"
                        title="Same contract number as Accounting portal"
                      >
                        {number}
                      </Link>
                    </Td>
                    <Td className="font-medium text-[var(--cf-ink)]">{title}</Td>
                    <Td>{name}</Td>
                    <Td>{p.start_date.slice(0, 10)}</Td>
                    <Td>{p.end_date ? p.end_date.slice(0, 10) : "—"}</Td>
                    <Td>{placementTypeLabel(p.placement_type)}</Td>
                    <Td>
                      <Badge tone={seedStatusTone(p.status)}>
                        {placementStatusLabel(p.status)}
                      </Badge>
                    </Td>
                    <Td className="text-center">
                      <PinContractButton
                        scope="client"
                        contractId={p.id}
                        contractNumber={number}
                        employeeName={name !== "—" ? name : undefined}
                        positionTitle={title}
                      />
                    </Td>
                  </tr>
                );
              })}
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
