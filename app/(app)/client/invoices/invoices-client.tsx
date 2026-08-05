"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, THead, Th, Td } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/form";
import type { Invoice } from "@/lib/types/database";
import {
  formatMoney,
  invoiceStatusLabel,
  seedStatusTone,
  shortInvoiceNumber,
} from "@/lib/client-portal/labels";
import { paginate } from "@/lib/client-portal/pagination";

export function InvoicesClient({
  companyName,
  invoices,
}: {
  companyName: string;
  invoices: Invoice[];
}) {
  const searchParams = useSearchParams();
  const initial = searchParams.get("status") ?? "All";
  const [status, setStatus] = useState(initial);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      if (status === "All") return true;
      if (status === "outstanding") return inv.status !== "paid";
      return inv.status === status;
    });
  }, [invoices, status]);

  const paged = paginate(filtered, page);

  const outstanding = invoices
    .filter((i) => i.status !== "paid")
    .reduce((s, i) => s + Number(i.amount), 0);
  const paid = invoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + Number(i.amount), 0);
  const disputedCount = invoices.filter((i) => i.status === "disputed").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description={`Invoices for ${companyName}. Open a full invoice or save it as a PDF from the print dialog.`}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Outstanding"
          value={formatMoney(outstanding)}
          hint="Not paid"
          href="/client/invoices?status=outstanding"
        />
        <StatCard
          label="Paid"
          value={formatMoney(paid)}
          hint="Status: paid"
          href="/client/invoices?status=paid"
        />
        <StatCard
          label="Disputed"
          value={String(disputedCount)}
          hint="Status: disputed"
          href="/client/invoices?status=disputed"
        />
      </div>

      <Select
        value={status}
        onChange={(e) => {
          setStatus(e.target.value);
          setPage(1);
        }}
        className="max-w-xs"
      >
        <option value="All">All statuses</option>
        <option value="outstanding">Outstanding (not paid)</option>
        <option value="draft">Draft</option>
        <option value="sent">Sent</option>
        <option value="paid">Paid</option>
        <option value="partial">Partially Paid</option>
        <option value="disputed">Disputed</option>
      </Select>

      {filtered.length === 0 ? (
        <EmptyState
          title={
            status === "All"
              ? "No invoices yet"
              : "No invoices match this filter"
          }
          description={
            status === "All"
              ? "Invoices generated for your placements will appear here."
              : "Clear or change the status filter to see other invoices."
          }
          action={
            status !== "All" ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setStatus("All");
                  setPage(1);
                }}
              >
                Clear filter
              </Button>
            ) : null
          }
        />
      ) : (
        <>
          <Table>
            <THead>
              <tr>
                <Th>Invoice</Th>
                <Th>Billing Period</Th>
                <Th>Amount</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </THead>
            <tbody>
              {paged.items.map((inv) => (
                <tr key={inv.id} className="hover:bg-[var(--cf-surface)]/60">
                  <Td className="font-medium">{shortInvoiceNumber(inv.id)}</Td>
                  <Td>
                    {inv.period_start.slice(0, 10)} –{" "}
                    {inv.period_end.slice(0, 10)}
                  </Td>
                  <Td>{formatMoney(Number(inv.amount))}</Td>
                  <Td>
                    <Badge tone={seedStatusTone(inv.status)}>
                      {invoiceStatusLabel(inv.status)}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-1.5">
                      <Button
                        size="sm"
                        variant="secondary"
                        href={`/client/invoices/${inv.id}`}
                      >
                        View Invoice
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        href={`/client/invoices/${inv.id}?print=1`}
                      >
                        Download PDF
                      </Button>
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
    </div>
  );
}
