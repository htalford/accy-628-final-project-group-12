"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, THead, Th, Td } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import type { Invoice } from "@/lib/types/database";
import type { InvoiceDetail } from "@/lib/client-portal/queries";
import {
  formatMoney,
  invoiceStatusLabel,
  seedStatusTone,
  shortInvoiceNumber,
} from "@/lib/client-portal/labels";
import { paginate } from "@/lib/client-portal/pagination";
import { getClientInvoiceDetailAction } from "@/app/actions/client-portal";

export function InvoicesClient({
  invoices,
}: {
  invoices: Invoice[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initial = searchParams.get("status") ?? "All";
  const openId = searchParams.get("open");
  const [status, setStatus] = useState(initial);
  const [page, setPage] = useState(1);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [detail, setDetail] = useState<InvoiceDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const loadDetail = useCallback((id: string) => {
    setPreviewId(id);
    setDetail(null);
    setDetailError(null);
    startTransition(async () => {
      const result = await getClientInvoiceDetailAction(id);
      if (!result.ok || !result.invoice) {
        setDetailError(result.message ?? "Could not load invoice.");
        return;
      }
      setDetail(result.invoice);
    });
  }, []);

  // Open preview from ?open= (search, deep links)
  useEffect(() => {
    if (openId) loadDetail(openId);
  }, [openId, loadDetail]);

  function closePreview() {
    setPreviewId(null);
    setDetail(null);
    setDetailError(null);
    if (openId) {
      const next = new URLSearchParams(searchParams.toString());
      next.delete("open");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  }

  function openInvoice(id: string) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("open", id);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    loadDetail(id);
  }

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

  const previewNumber = previewId ? shortInvoiceNumber(previewId) : "";

  return (
    <div className="space-y-6">
      <PageHeader title="Invoices" />

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
                <tr
                  key={inv.id}
                  className="cursor-pointer hover:bg-[var(--cf-surface)]/60"
                  onClick={() => openInvoice(inv.id)}
                >
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
                    <div
                      className="flex flex-wrap gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        size="sm"
                        variant="secondary"
                        type="button"
                        onClick={() => openInvoice(inv.id)}
                      >
                        View summary
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        href={`/client/invoices/${inv.id}`}
                      >
                        Full page
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

      <Modal
        open={previewId != null}
        onClose={closePreview}
        title={
          detail
            ? `Invoice ${shortInvoiceNumber(detail.id)}`
            : `Invoice ${previewNumber}`
        }
        className="max-h-[90vh] max-w-2xl overflow-y-auto"
      >
        {pending && !detail ? (
          <p className="text-sm text-[var(--cf-muted)]">Loading invoice…</p>
        ) : null}
        {detailError ? (
          <p className="text-sm text-rose-700">{detailError}</p>
        ) : null}
        {detail ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={seedStatusTone(detail.status)}>
                {invoiceStatusLabel(detail.status)}
              </Badge>
              <span className="text-sm text-[var(--cf-muted)]">
                Issued {detail.created_at.slice(0, 10)}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold tracking-wide text-[var(--cf-muted)] uppercase">
                  Bill to
                </p>
                <p className="mt-1 text-sm font-medium text-[var(--cf-ink)]">
                  {detail.clientName}
                </p>
                {detail.clientBillingEmail ? (
                  <p className="text-xs text-[var(--cf-muted)]">
                    {detail.clientBillingEmail}
                  </p>
                ) : null}
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wide text-[var(--cf-muted)] uppercase">
                  Billing period
                </p>
                <p className="mt-1 text-sm text-[var(--cf-ink)]">
                  {detail.period_start.slice(0, 10)} –{" "}
                  {detail.period_end.slice(0, 10)}
                </p>
                {detail.placementLabel ? (
                  <p className="mt-1 text-xs text-[var(--cf-muted)]">
                    {detail.placementLabel}
                    {detail.employeeName ? ` · ${detail.employeeName}` : ""}
                  </p>
                ) : null}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold tracking-wide text-[var(--cf-muted)] uppercase">
                Line items
              </p>
              <ul className="divide-y divide-[var(--cf-border)] rounded-lg border border-[var(--cf-border)]">
                {detail.lineItems.map((line) => (
                  <li
                    key={line.id}
                    className="flex flex-col gap-0.5 px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="text-[var(--cf-ink)]">
                      {line.description}
                    </span>
                    <span className="shrink-0 text-[var(--cf-muted)]">
                      {line.quantity} × {formatMoney(line.rate)} ={" "}
                      <span className="font-medium text-[var(--cf-ink)]">
                        {formatMoney(line.amount)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex justify-end text-sm">
                <p className="font-semibold text-[var(--cf-ink)]">
                  Amount due · {formatMoney(Number(detail.amount))}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--cf-border)] pt-4">
              <Button type="button" variant="secondary" onClick={closePreview}>
                Close
              </Button>
              <Button
                type="button"
                variant="secondary"
                href={`/client/invoices/${detail.id}?print=1`}
              >
                Download PDF
              </Button>
              <Button type="button" href={`/client/invoices/${detail.id}`}>
                Open full invoice
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
