import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getAppUser } from "@/lib/auth/get-app-user";
import {
  isApprovedTimesheet,
  isCompletedPayment,
  isRecognizedExpense,
  isRecognizedInvoice,
} from "@/lib/accounting/calculations";
import {
  buildInvoiceJournal,
  buildOperatingExpenseJournal,
  buildPaymentJournal,
  buildPlacementExpenseJournal,
  buildTimesheetJournal,
  type JournalPostingDraft,
} from "@/lib/accounting/journal-posting";
import {
  getExpenses,
  getInvoices,
  getOperatingExpenses,
  getTimesheets,
} from "@/lib/accounting/queries";
import type { JournalEntrySourceType } from "@/lib/types/database";

export type SyncJournalResult = {
  created: number;
  skipped: number;
  errors: string[];
};

async function existingSources(
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  const { data } = await supabase
    .from("journal_entries")
    .select("source_type, source_id")
    .neq("status", "void")
    .not("source_id", "is", null);
  const set = new Set<string>();
  for (const row of data ?? []) {
    if (row.source_type && row.source_id) {
      set.add(`${row.source_type}:${row.source_id}`);
    }
  }
  return set;
}

export async function insertJournalDraft(
  draft: JournalPostingDraft,
  userId: string | null,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const supabase = await createClient();
  const err = await insertDraft(supabase, draft, userId);
  if (err) return { ok: false, error: err };
  return { ok: true, id: draft.sourceId };
}

async function insertDraft(
  supabase: Awaited<ReturnType<typeof createClient>>,
  draft: JournalPostingDraft,
  userId: string | null,
): Promise<string | null> {
  const now = new Date().toISOString();
  const { data: entry, error } = await supabase
    .from("journal_entries")
    .insert({
      entry_date: draft.entryDate,
      memo: draft.memo,
      reference: draft.reference,
      status: "posted",
      source_type: draft.sourceType,
      source_id: draft.sourceId,
      created_by: userId,
      posted_at: now,
      updated_at: now,
    })
    .select("id")
    .single();

  if (error || !entry) return error?.message ?? "insert failed";

  const { error: linesError } = await supabase.from("journal_entry_lines").insert(
    draft.lines.map((line, index) => ({
      journal_entry_id: entry.id,
      line_no: index + 1,
      account_code: line.accountCode,
      account_name: line.accountName,
      description: line.description,
      debit: line.debit,
      credit: line.credit,
    })),
  );

  if (linesError) {
    await supabase.from("journal_entries").delete().eq("id", entry.id);
    return linesError.message;
  }
  return null;
}

/** Idempotent sync: create missing posted JEs from operational transactions. */
export async function syncJournalEntriesFromOps(): Promise<SyncJournalResult> {
  const user = await getAppUser();
  if (!user || user.role !== "accounting") {
    return {
      created: 0,
      skipped: 0,
      errors: ["Only accounting can sync journal entries."],
    };
  }

  const supabase = await createClient();
  const existing = await existingSources(supabase);
  const drafts: JournalPostingDraft[] = [];

  const [invoices, timesheets, expenses, operatingExpenses] = await Promise.all([
    getInvoices(),
    getTimesheets(),
    getExpenses(),
    getOperatingExpenses(),
  ]);

  const { data: payments } = await supabase
    .from("payments")
    .select("id, invoice_id, amount, status, payment_date");

  const { data: placements } = await supabase
    .from("placements")
    .select("id, placement_type");
  const placementType = new Map(
    (placements ?? []).map((p) => [p.id as string, p.placement_type as string]),
  );

  for (const inv of invoices) {
    if (!isRecognizedInvoice(inv.status)) continue;
    const key = `invoice:${inv.id}`;
    if (existing.has(key)) continue;
    const draft = buildInvoiceJournal({
      id: inv.id,
      clientName: inv.clientName,
      amount: inv.amount,
      periodEnd: inv.periodEnd,
      placementType: inv.placementId
        ? placementType.get(inv.placementId)
        : null,
    });
    if (draft) drafts.push(draft);
  }

  for (const pay of payments ?? []) {
    if (!isCompletedPayment(pay.status as string)) continue;
    const key = `payment:${pay.id}`;
    if (existing.has(key)) continue;
    const draft = buildPaymentJournal({
      id: pay.id as string,
      amount: Number(pay.amount),
      paymentDate: (pay.payment_date as string) || new Date().toISOString().slice(0, 10),
      invoiceId: pay.invoice_id as string,
    });
    if (draft) drafts.push(draft);
  }

  for (const ts of timesheets) {
    if (!isApprovedTimesheet(ts.status)) continue;
    const key = `timesheet:${ts.id}`;
    if (existing.has(key)) continue;
    const draft = buildTimesheetJournal({
      id: ts.id,
      employeeName: ts.employeeName,
      weekEnding: ts.weekEnding,
      grossPay: ts.grossPay,
    });
    if (draft) drafts.push(draft);
  }

  for (const exp of expenses) {
    if (!isRecognizedExpense(exp.status)) continue;
    const key = `expense:${exp.id}`;
    if (existing.has(key)) continue;
    const draft = buildPlacementExpenseJournal({
      id: exp.id,
      expenseType: exp.expenseType,
      description: exp.description,
      amount: exp.amount,
      expenseDate: exp.expenseDate,
      status: exp.status,
    });
    if (draft) drafts.push(draft);
  }

  for (const ox of operatingExpenses) {
    const key = `operating_expense:${ox.id}`;
    if (existing.has(key)) continue;
    const draft = buildOperatingExpenseJournal({
      id: ox.id,
      category: ox.category,
      description: ox.description,
      amount: ox.amount,
      expenseDate: ox.expenseDate,
    });
    if (draft) drafts.push(draft);
  }

  let created = 0;
  let skipped = existing.size;
  const errors: string[] = [];

  for (const draft of drafts) {
    const err = await insertDraft(supabase, draft, user.id);
    if (err) {
      errors.push(`${draft.sourceType}:${draft.sourceId} — ${err}`);
    } else {
      created += 1;
      existing.add(`${draft.sourceType}:${draft.sourceId}`);
    }
  }

  return { created, skipped, errors };
}

export function isLinkedSourceType(
  value: string,
): value is JournalEntrySourceType {
  return [
    "invoice",
    "payment",
    "timesheet",
    "expense",
    "operating_expense",
    "manual",
    "opening",
  ].includes(value);
}
