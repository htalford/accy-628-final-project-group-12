"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/accounting/panel";
import { createInvoice } from "@/app/actions/create-invoice";
import { updateInvoice } from "@/app/actions/invoice-mutations";
import { moneyExact } from "@/lib/accounting/format";
import { roundMoney } from "@/lib/accounting/calculations";
import type { InvoiceStatus } from "@/lib/types/database";

type ClientOption = { id: string; name: string };
type ContractOption = {
  id: string;
  clientId: string | null;
  clientName: string;
  employeeName: string;
  billRate: number | null;
  status: string;
};

type LineDraft = {
  key: string;
  description: string;
  quantity: string;
  rate: string;
};

function newLine(rate = ""): LineDraft {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    description: "",
    quantity: "1",
    rate,
  };
}

export function CreateInvoiceForm({
  clients,
  contracts,
  mode = "create",
  invoiceId,
  initial,
}: {
  clients: ClientOption[];
  contracts: ContractOption[];
  mode?: "create" | "edit";
  invoiceId?: string;
  initial?: {
    clientId: string;
    placementId: string | null;
    periodStart: string;
    periodEnd: string;
    status: InvoiceStatus;
    lines: {
      description: string;
      quantity: number;
      rate: number;
      timesheetId?: string | null;
    }[];
  };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [clientId, setClientId] = useState(
    initial?.clientId ?? clients[0]?.id ?? "",
  );
  const [placementId, setPlacementId] = useState(initial?.placementId ?? "");
  const [periodStart, setPeriodStart] = useState(initial?.periodStart ?? "");
  const [periodEnd, setPeriodEnd] = useState(initial?.periodEnd ?? "");
  const [status, setStatus] = useState<InvoiceStatus>(
    initial?.status ?? "draft",
  );
  const [lines, setLines] = useState<LineDraft[]>(() => {
    if (initial?.lines?.length) {
      return initial.lines.map((line) => ({
        key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        description: line.description,
        quantity: String(line.quantity),
        rate: String(line.rate),
      }));
    }
    return [newLine()];
  });

  const filteredContracts = useMemo(
    () =>
      contracts.filter(
        (c) => !clientId || c.clientId === clientId || !c.clientId,
      ),
    [contracts, clientId],
  );

  const selectedContract = contracts.find((c) => c.id === placementId) ?? null;

  const lineAmounts = lines.map((line) => {
    const quantity = Number(line.quantity);
    const rate = Number(line.rate);
    if (!Number.isFinite(quantity) || !Number.isFinite(rate)) return 0;
    return roundMoney(quantity * rate);
  });
  const total = roundMoney(lineAmounts.reduce((s, n) => s + n, 0));

  function onClientChange(nextClientId: string) {
    setClientId(nextClientId);
    if (placementId) {
      const contract = contracts.find((c) => c.id === placementId);
      if (contract && contract.clientId !== nextClientId) {
        setPlacementId("");
      }
    }
  }

  function onContractChange(nextPlacementId: string) {
    setPlacementId(nextPlacementId);
    if (!nextPlacementId) return;
    const contract = contracts.find((c) => c.id === nextPlacementId);
    if (!contract) return;
    if (contract.clientId) setClientId(contract.clientId);
    const rate =
      contract.billRate != null ? String(contract.billRate) : "";
    setLines((prev) => {
      if (prev.length === 1 && !prev[0].description && !prev[0].rate) {
        return [{ ...prev[0], rate }];
      }
      return prev.map((line, i) =>
        i === 0 && !line.rate ? { ...line, rate } : line,
      );
    });
  }

  function updateLine(key: string, patch: Partial<LineDraft>) {
    setLines((prev) =>
      prev.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    );
  }

  function removeLine(key: string) {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.key !== key)));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const linesPayload = lines.map((line) => ({
      description: line.description,
      quantity: Number(line.quantity),
      rate: Number(line.rate),
    }));
    startTransition(async () => {
      const result =
        mode === "edit" && invoiceId
          ? await updateInvoice(invoiceId, {
              clientId,
              placementId: placementId || null,
              periodStart,
              periodEnd,
              status,
              lines: linesPayload,
            })
          : await createInvoice({
              clientId,
              placementId: placementId || null,
              periodStart,
              periodEnd,
              status: status === "draft" ? "draft" : "sent",
              lines: linesPayload,
            });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/accounting/invoices/${result.id}`);
      router.refresh();
    });
  }

  const fieldClass =
    "w-full rounded-md border border-[var(--cf-border)] bg-white px-3 py-2 text-sm text-[var(--cf-ink)] outline-none focus:ring-2 focus:ring-[var(--cf-accent)]";

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Panel title="Invoice details">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-[var(--cf-ink)]">
              Client
            </span>
            <select
              required
              value={clientId}
              onChange={(e) => onClientChange(e.target.value)}
              className={fieldClass}
            >
              <option value="" disabled>
                Select client
              </option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-[var(--cf-ink)]">
              Contract
            </span>
            <select
              value={placementId}
              onChange={(e) => onContractChange(e.target.value)}
              className={fieldClass}
            >
              <option value="">None</option>
              {filteredContracts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.clientName} · {c.employeeName}
                  {c.billRate != null ? ` · $${c.billRate}/hr` : ""}
                </option>
              ))}
            </select>
            {selectedContract?.billRate != null ? (
              <span className="mt-1 block text-xs text-[var(--cf-muted)]">
                Bill rate {moneyExact(selectedContract.billRate)} (OT bills at
                1.5×)
              </span>
            ) : null}
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-[var(--cf-ink)]">
              Period start
            </span>
            <input
              type="date"
              required
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              className={fieldClass}
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-[var(--cf-ink)]">
              Period end
            </span>
            <input
              type="date"
              required
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              className={fieldClass}
            />
          </label>

          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-[var(--cf-ink)]">
              Status
            </span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as InvoiceStatus)}
              className={`${fieldClass} max-w-xs`}
            >
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              {mode === "edit" ? (
                <>
                  <option value="partial">Partial</option>
                  <option value="paid">Paid</option>
                  <option value="disputed">Disputed</option>
                </>
              ) : null}
            </select>
          </label>
        </div>
      </Panel>

      <Panel
        title="Line items"
        description="Invoice total must equal the sum of line amounts."
        action={
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              setLines((prev) => [
                ...prev,
                newLine(
                  selectedContract?.billRate != null
                    ? String(selectedContract.billRate)
                    : "",
                ),
              ])
            }
          >
            Add line
          </Button>
        }
      >
        <div className="space-y-3">
          <div className="hidden grid-cols-[1.6fr_0.7fr_0.7fr_0.8fr_auto] gap-2 text-xs font-medium tracking-wide text-[var(--cf-muted)] uppercase sm:grid">
            <span>Description</span>
            <span>Qty</span>
            <span>Rate</span>
            <span>Amount</span>
            <span />
          </div>
          {lines.map((line, index) => (
            <div
              key={line.key}
              className="grid gap-2 sm:grid-cols-[1.6fr_0.7fr_0.7fr_0.8fr_auto]"
            >
              <input
                required
                placeholder="Description"
                value={line.description}
                onChange={(e) =>
                  updateLine(line.key, { description: e.target.value })
                }
                className={fieldClass}
              />
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Qty"
                value={line.quantity}
                onChange={(e) =>
                  updateLine(line.key, { quantity: e.target.value })
                }
                className={fieldClass}
              />
              <input
                required
                type="number"
                min="0"
                step="0.01"
                placeholder="Rate"
                value={line.rate}
                onChange={(e) => updateLine(line.key, { rate: e.target.value })}
                className={fieldClass}
              />
              <div className="flex items-center rounded-md border border-[var(--cf-border)] bg-[var(--cf-surface)] px-3 py-2 text-sm font-medium text-[var(--cf-ink)]">
                {moneyExact(lineAmounts[index] ?? 0)}
              </div>
              <Button
                type="button"
                variant="ghost"
                disabled={lines.length <= 1}
                onClick={() => removeLine(line.key)}
                className="px-2"
              >
                Remove
              </Button>
            </div>
          ))}
          <div className="flex justify-end border-t border-[var(--cf-border)] pt-3 text-sm">
            <p className="font-semibold text-[var(--cf-ink)]">
              Invoice total: {moneyExact(total)}
            </p>
          </div>
        </div>
      </Panel>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending || !clientId}>
          {pending
            ? mode === "edit"
              ? "Saving…"
              : "Creating…"
            : mode === "edit"
              ? "Save changes"
              : "Create invoice"}
        </Button>
        <Link
          href={
            mode === "edit" && invoiceId
              ? `/accounting/invoices/${invoiceId}`
              : "/accounting/invoices"
          }
          className="text-sm font-medium text-[var(--cf-ink)] hover:underline"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
