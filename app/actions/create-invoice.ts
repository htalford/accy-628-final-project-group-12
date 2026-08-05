"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAppUser } from "@/lib/auth/get-app-user";
import { roundMoney, sumMoney } from "@/lib/accounting/calculations";
import type { InvoiceStatus } from "@/lib/types/database";

export type CreateInvoiceLineInput = {
  description: string;
  quantity: number;
  rate: number;
  timesheetId?: string | null;
};

export type CreateInvoiceInput = {
  clientId: string;
  placementId?: string | null;
  periodStart: string;
  periodEnd: string;
  status: Extract<InvoiceStatus, "draft" | "sent">;
  lines: CreateInvoiceLineInput[];
};

export type CreateInvoiceResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function createInvoice(
  input: CreateInvoiceInput,
): Promise<CreateInvoiceResult> {
  const user = await getAppUser();
  if (!user || (user.role !== "accounting" && user.role !== "recruiter")) {
    return { ok: false, error: "You do not have permission to create invoices." };
  }

  const clientId = input.clientId?.trim();
  const periodStart = input.periodStart?.trim();
  const periodEnd = input.periodEnd?.trim();
  const placementId = input.placementId?.trim() || null;

  if (!clientId) {
    return { ok: false, error: "Select a client." };
  }
  if (!periodStart || !periodEnd) {
    return { ok: false, error: "Enter billing period start and end dates." };
  }
  if (periodEnd < periodStart) {
    return { ok: false, error: "Period end must be on or after period start." };
  }
  if (input.status !== "draft" && input.status !== "sent") {
    return { ok: false, error: "Status must be draft or sent." };
  }

  const lines = (input.lines ?? [])
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

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      client_id: clientId,
      placement_id: placementId,
      period_start: periodStart,
      period_end: periodEnd,
      amount,
      status: input.status,
    })
    .select("id")
    .single();

  if (invoiceError || !invoice) {
    return {
      ok: false,
      error: invoiceError?.message ?? "Could not create invoice.",
    };
  }

  const { error: linesError } = await supabase.from("invoice_line_items").insert(
    lines.map((line) => ({
      invoice_id: invoice.id,
      timesheet_id: line.timesheetId,
      description: line.description,
      quantity: line.quantity,
      rate: line.rate,
      amount: line.amount,
    })),
  );

  if (linesError) {
    await supabase.from("invoices").delete().eq("id", invoice.id);
    return {
      ok: false,
      error: linesError.message ?? "Could not save invoice line items.",
    };
  }

  revalidatePath("/accounting/invoices");
  revalidatePath("/accounting/accounts-receivable");
  revalidatePath("/accounting/dashboard");
  revalidatePath("/accounting/audit-trail");
  revalidatePath("/accounting/profitability");
  if (placementId) {
    revalidatePath(`/accounting/contracts/${placementId}`);
  }

  return { ok: true, id: invoice.id as string };
}
