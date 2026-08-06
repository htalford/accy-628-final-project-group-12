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
import type { PlacementWithEmployee } from "@/lib/client-portal/types";
import {
  formatMoney,
  placementPositionTitle,
  placementStatusLabel,
  placementTypeLabel,
  seedStatusTone,
  shortPlacementNumber,
} from "@/lib/client-portal/labels";
import { paginate } from "@/lib/client-portal/pagination";

function daysBetween(start: string, end: string | null): number {
  const s = new Date(start.slice(0, 10) + "T12:00:00").getTime();
  const e = end
    ? new Date(end.slice(0, 10) + "T12:00:00").getTime()
    : Date.now();
  if (Number.isNaN(s) || Number.isNaN(e)) return 0;
  return Math.max(0, Math.floor((e - s) / 86_400_000));
}

function tenureLabel(days: number, openEnded: boolean): string {
  if (days < 30) return openEnded ? `${days}d (open)` : `${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) {
    return openEnded ? `${months} mo (open)` : `${months} mo`;
  }
  const years = (days / 365).toFixed(1);
  return openEnded ? `${years} yr (open)` : `${years} yr`;
}

type SortKey =
  | "start_desc"
  | "start_asc"
  | "tenure_desc"
  | "tenure_asc"
  | "pay_desc"
  | "pay_asc"
  | "position_asc"
  | "employee_asc";

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
  const [position, setPosition] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [tenure, setTenure] = useState("All");
  const [payBand, setPayBand] = useState("All");
  const [sort, setSort] = useState<SortKey>("start_desc");
  const [page, setPage] = useState(1);

  const positions = useMemo(() => {
    const set = new Set(
      placements.map((p) => placementPositionTitle(p.title, p.placement_type)),
    );
    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [placements]);

  const filtered = useMemo(() => {
    const list = placements.filter((p) => {
      const name = p.employee
        ? `${p.employee.first_name} ${p.employee.last_name}`
        : "";
      const title = placementPositionTitle(p.title, p.placement_type);
      const number = shortPlacementNumber(p.id);
      const days = daysBetween(p.start_date, p.end_date);
      const pay = p.pay_rate;

      const matchesQ =
        !q ||
        name.toLowerCase().includes(q.toLowerCase()) ||
        title.toLowerCase().includes(q.toLowerCase()) ||
        number.toLowerCase().includes(q.toLowerCase()) ||
        p.id.toLowerCase().includes(q.toLowerCase());

      const matchesStatus =
        status === "All" || p.status === status;

      const matchesPosition = position === "All" || title === position;
      const matchesType =
        typeFilter === "All" || p.placement_type === typeFilter;

      let matchesTenure = true;
      if (tenure === "open") matchesTenure = p.end_date == null;
      else if (tenure === "lt3") matchesTenure = days < 90;
      else if (tenure === "3to12")
        matchesTenure = days >= 90 && days < 365;
      else if (tenure === "gte12") matchesTenure = days >= 365;

      let matchesPay = true;
      if (payBand === "unknown") matchesPay = pay == null;
      else if (payBand === "lt30")
        matchesPay = pay != null && pay < 30;
      else if (payBand === "30to45")
        matchesPay = pay != null && pay >= 30 && pay < 45;
      else if (payBand === "gte45") matchesPay = pay != null && pay >= 45;

      return (
        matchesQ &&
        matchesStatus &&
        matchesPosition &&
        matchesType &&
        matchesTenure &&
        matchesPay
      );
    });

    const sorted = [...list];
    sorted.sort((a, b) => {
      const titleA = placementPositionTitle(a.title, a.placement_type);
      const titleB = placementPositionTitle(b.title, b.placement_type);
      const nameA = a.employee
        ? `${a.employee.first_name} ${a.employee.last_name}`
        : "";
      const nameB = b.employee
        ? `${b.employee.first_name} ${b.employee.last_name}`
        : "";
      const daysA = daysBetween(a.start_date, a.end_date);
      const daysB = daysBetween(b.start_date, b.end_date);
      const payA = a.pay_rate ?? -1;
      const payB = b.pay_rate ?? -1;

      switch (sort) {
        case "start_asc":
          return a.start_date.localeCompare(b.start_date);
        case "tenure_desc":
          return daysB - daysA;
        case "tenure_asc":
          return daysA - daysB;
        case "pay_desc":
          return payB - payA;
        case "pay_asc":
          return payA - payB;
        case "position_asc":
          return titleA.localeCompare(titleB);
        case "employee_asc":
          return nameA.localeCompare(nameB);
        case "start_desc":
        default:
          return b.start_date.localeCompare(a.start_date);
      }
    });

    return sorted;
  }, [
    placements,
    q,
    status,
    position,
    typeFilter,
    tenure,
    payBand,
    sort,
  ]);

  const paged = paginate(filtered, page);
  const hasFilters =
    q.trim() !== "" ||
    status !== "All" ||
    position !== "All" ||
    typeFilter !== "All" ||
    tenure !== "All" ||
    payBand !== "All";

  function clearFilters() {
    setQ("");
    setStatus("All");
    setPosition("All");
    setTypeFilter("All");
    setTenure("All");
    setPayBand("All");
    setSort("start_desc");
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contracts"
        description={`${companyName} · same placements and contract numbers as the Accounting portal.`}
      />

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
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
            value={position}
            onChange={(e) => {
              setPosition(e.target.value);
              setPage(1);
            }}
            className="sm:max-w-[12rem]"
          >
            {positions.map((p) => (
              <option key={p} value={p}>
                {p === "All" ? "All positions" : p}
              </option>
            ))}
          </Select>
          <Select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="sm:max-w-[11rem]"
          >
            <option value="All">Temp & permanent</option>
            <option value="temp">Temp / Hourly</option>
            <option value="permanent">Permanent</option>
          </Select>
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="sm:max-w-[12rem]"
          >
            <option value="All">All statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Select
            value={tenure}
            onChange={(e) => {
              setTenure(e.target.value);
              setPage(1);
            }}
            className="sm:max-w-[12rem]"
          >
            <option value="All">Any length</option>
            <option value="open">Open-ended only</option>
            <option value="lt3">Under 3 months</option>
            <option value="3to12">3–12 months</option>
            <option value="gte12">12+ months</option>
          </Select>
          <Select
            value={payBand}
            onChange={(e) => {
              setPayBand(e.target.value);
              setPage(1);
            }}
            className="sm:max-w-[12rem]"
          >
            <option value="All">Any pay rate</option>
            <option value="lt30">Pay under $30/hr</option>
            <option value="30to45">Pay $30–45/hr</option>
            <option value="gte45">Pay $45+/hr</option>
            <option value="unknown">Pay not set</option>
          </Select>
          <Select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as SortKey);
              setPage(1);
            }}
            className="sm:max-w-[14rem]"
          >
            <option value="start_desc">Sort: newest start</option>
            <option value="start_asc">Sort: oldest start</option>
            <option value="tenure_desc">Sort: longest tenure</option>
            <option value="tenure_asc">Sort: shortest tenure</option>
            <option value="pay_desc">Sort: highest pay</option>
            <option value="pay_asc">Sort: lowest pay</option>
            <option value="position_asc">Sort: position A–Z</option>
            <option value="employee_asc">Sort: employee A–Z</option>
          </Select>
          {hasFilters || sort !== "start_desc" ? (
            <Button type="button" variant="secondary" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          ) : null}
          <p className="text-sm text-[var(--cf-muted)] sm:ml-auto">
            {filtered.length} contract{filtered.length === 1 ? "" : "s"}
          </p>
        </div>
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
              ? "Adjust position, type, length, pay, or status to widen results."
              : "Placements that accounting records for your company will appear here."
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
                <Th>Contract #</Th>
                <Th>Position</Th>
                <Th>Employee</Th>
                <Th>Start</Th>
                <Th>Length</Th>
                <Th>Pay</Th>
                <Th>Type</Th>
                <Th>Status</Th>
              </tr>
            </THead>
            <tbody>
              {paged.items.map((p) => {
                const name = p.employee
                  ? `${p.employee.first_name} ${p.employee.last_name}`
                  : "—";
                const number = shortPlacementNumber(p.id);
                const title = placementPositionTitle(p.title, p.placement_type);
                const days = daysBetween(p.start_date, p.end_date);
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
                    <Td className="text-sm text-[var(--cf-muted)]">
                      {tenureLabel(days, p.end_date == null)}
                    </Td>
                    <Td className="text-sm tabular-nums">
                      {p.pay_rate != null ? formatMoney(p.pay_rate) : "—"}
                    </Td>
                    <Td>{placementTypeLabel(p.placement_type)}</Td>
                    <Td>
                      <Badge tone={seedStatusTone(p.status)}>
                        {placementStatusLabel(p.status)}
                      </Badge>
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
