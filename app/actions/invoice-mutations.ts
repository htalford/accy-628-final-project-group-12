"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAppUser } from "@/lib/auth/get-app-user";
import {
  isRecognizedInvoice,
  roundMoney,
  sumMoney,
} from "@/lib/accounting/calculations";
import { buildInvoiceJournal } from "@/lib/accounting/journal-posting";
import { insertJournalDraft } from "@/lib/accounting/sync-journal-entries";
import type { InvoiceStatus } from "@/lib/types/database";
import type {
  CreateInvoiceLineInput,
  CreateInvoiceResult,
} from "@/app/actions/create-invoice";

const EDITABLE_STATUSES: InvoiceStatus[] = [
  "draft",
  "sent",
  "paid",
  "partial",
  "disputed",
];

export type UpdateInvoiceInput = {
  clientId: string;
  placementId?: string | null;
  periodStart: string;
  periodEnd: string;
  status: InvoiceStatus;
  lines: CreateInvoiceLineInput[];
};

function revalidateInvoice(id: string, placementId?: string | null) {
  revalidatePath("/accounting/invoices");
  revalidatePath(`/accounting/invoices/${id}`);
  revalidatePath("/accounting/accounts-receivable");
  revalidatePath("/accounting/dashboard");
  revalidatePath("/accounting/audit-trail");
  revalidatePath("/accounting/profitability");
  revalidatePath("/accounting/journal-entries");
  revalidatePath("/accounting/reports");
  if (placementId) revalidatePath(`/accounting/contracts/${placementId}`);
}

async function requireInvoiceEditor() {
  const user = await getAppUser();
  if (!user || (user.role !== "accounting" && user.role !== "recruiter")) {
    return { error: "You do not have permission to manage invoices.", user: null };
  }
  return { error: null, user };
}

function normalizeLines(input: CreateInvoiceLineInput[]) {
  return (input ?? [])
    .map((line) => {
      const description = line.description?.trim() ?? "";
      const quantity = Number(line.quantity);
      const rate = Number(line.rate);
      const amount = roundMoney(quantity * rate);
      return {
        description,
        quantity,
        rate,
        amount,
        timesheetId: line.timesheetId?.trim() || null,
      };
    })
    .filter((line) => line.description.length > 0);
}

async function syncInvoiceJournal(input: {
  invoiceId: string;
  clientId: string;
  placementId: string | null;
  amount: number;
  periodEnd: string;
  status: InvoiceStatus;
  userId: string;
}) {
  const supabase = await createClient();
  await supabase
    .from("journal_entries")
    .delete()
    .eq("source_type", "invoice")
    .eq("source_id", input.invoiceId);

  if (!isRecognizedInvoice(input.status)) return;

  const { data: client } = await supabase
    .from("clients")
    .select("name")
    .eq("id", input.clientId)
    .maybeSingle();
  let placementType: string | null = null;
  if (input.placementId) {
    const { data: placement } = await supabase
      .from("placements")
      .select("placement_type")
      .eq("id", input.placementId)
      .maybeSingle();
    placementType = (placement?.placement_type as string | null) ?? null;
  }
  const draft = buildInvoiceJournal({
    id: input.invoiceId,
    clientName: (client?.name as string) || "Client",
    amount: input.amount,
    periodEnd: input.periodEnd,
    placementType,
  });
  if (draft) await insertJournalDraft(draft, input.userId);
}

export async function updateInvoice(
  id: string,
  input: UpdateInvoiceInput,
): Promise<CreateInvoiceResult> {
  const { error: authError, user } = await requireInvoiceEditor();
  if (authError || !user) {
    return { ok: false, error: authError ?? "Unauthorized" };
  }
  if (!id?.trim()) return { ok: false, error: "Missing invoice id." };

  const clientId = input.clientId?.trim();
  const periodStart = input.periodStart?.trim();
  const periodEnd = input.periodEnd?.trim();
  const placementId = input.placementId?.trim() || null;
  const status = input.status;

  if (!clientId) return { ok: false, error: "Select a client." };
  if (!periodStart || !periodEnd) {
    return { ok: false, error: "Enter billing period start and end dates." };
  }
  if (periodEnd < periodStart) {
    return { ok: false, error: "Period end must be on or after period start." };
  }
  if (!EDITABLE_STATUSES.includes(status)) {
    return { ok: false, error: "Select a valid status." };
  }

  const lines = normalizeLines(input.lines);
  if (lines.length === 0) {
    return { ok: false, error: "Add at least one line item with a description." };
  }
  for (const line of lines) {
    if (!Number.isFinite(line.quantity) || line.quantity <= 0) {
      return { ok: false, error: "Each line quantity must be greater than zero." };
    }
    if (!Number.isFinite(line.rate) || line.rate < 0) {
      return { ok: false, error: "Each line rate must be zero or greater." };
    }
  }

  const amount = sumMoney(lines.map((l) => l.amount));
  const supabase = await createClient();

  const { data: existing, error: existingError } = await supabase
    .from("invoices")
    .select("id, placement_id")
    .eq("id", id)
    .maybeSingle();
  if (existingError || !existing) {
    return { ok: false, error: "Invoice not found." };
  }

  if (placementId) {
    const { data: placement, error: placementError } = await supabase
      .from("placements")
      .select("id, client_id")
      .eq("id", placementId)
      .maybeSingle();
    if (placementError || !placement) {
      return { ok: false, error: "Selected contract was not found." };
    }
    if (placement.client_id !== clientId) {
      return {
        ok: false,
        error: "Selected contract does not belong to the chosen client.",
      };
    }
  }

  const { error: updateError } = await supabase
    .from("invoices")
    .update({
      client_id: clientId,
      placement_id: placementId,
      period_start: periodStart,
      period_end: periodEnd,
      amount,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (updateError) return { ok: false, error: updateError.message };

  const { error: deleteLinesError } = await supabase
    .from("invoice_line_items")
    .delete()
    .eq("invoice_id", id);
  if (deleteLinesError) return { ok: false, error: deleteLinesError.message };

  const { error: linesError } = await supabase.from("invoice_line_items").insert(
    lines.map((line) => ({
      invoice_id: id,
      timesheet_id: line.timesheetId,
      description: line.description,
      quantity: line.quantity,
      rate: line.rate,
      amount: line.amount,
    })),
  );
  if (linesError) return { ok: false, error: linesError.message };

  await syncInvoiceJournal({
    invoiceId: id,
    clientId,
    placementId,
    amount,
    periodEnd,
    status,
    userId: user.id,
  });

  revalidateInvoice(id, placementId ?? (existing.placement_id as string | null));
  return { ok: true, id };
}

export async function deleteInvoice(id: string): Promise<CreateInvoiceResult> {
  const { error: authError } = await requireInvoiceEditor();
  if (authError) return { ok: false, error: authError };
  if (!id?.trim()) return { ok: false, error: "Missing invoice id." };

  const supabase = await createClient();
  const { data: existing, error: existingError } = await supabase
    .from("invoices")
    .select("id, placement_id")
    .eq("id", id)
    .maybeSingle();
  if (existingError || !existing) {
    return { ok: false, error: "Invoice not found." };
  }

  // Remove linked ledger entry and payments first.
  await supabase
    .from("journal_entries")
    .delete()
    .eq("source_type", "invoice")
    .eq("source_id", id);

  const { data: payments } = await supabase
    .from("payments")
    .select("id")
    .eq("invoice_id", id);
  const paymentIds = (payments ?? []).map((p) => p.id as string);
  if (paymentIds.length > 0) {
    await supabase
      .from("journal_entries")
      .delete()
      .eq("source_type", "payment")
      .in("source_id", paymentIds);
    await supabase.from("payments").delete().eq("invoice_id", id);
  }

  await supabase.from("invoice_line_items").delete().eq("invoice_id", id);

  const { error } = await supabase.from("invoices").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidateInvoice(id, existing.placement_id as string | null);
  return { ok: true, id };
}
