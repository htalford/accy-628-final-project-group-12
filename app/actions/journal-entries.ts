"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAppUser } from "@/lib/auth/get-app-user";
import { roundMoney, sumMoney } from "@/lib/accounting/calculations";
import { accountNameForCode } from "@/lib/accounting/chart-of-accounts";
import { JOURNAL_ENTRY_STATUSES } from "@/lib/accounting/format";
import type { JournalEntryStatus } from "@/lib/types/database";

export type JournalLineInput = {
  accountCode: string;
  description?: string;
  debit: number;
  credit: number;
};

export type JournalEntryInput = {
  entryDate: string;
  memo: string;
  reference?: string;
  status: JournalEntryStatus;
  lines: JournalLineInput[];
};

type ActionResult =
  | { ok: true; id: string; message?: string }
  | { ok: false; error: string };

function revalidateJournal(id?: string) {
  revalidatePath("/accounting/journal-entries");
  if (id) revalidatePath(`/accounting/journal-entries/${id}`);
  revalidatePath("/accounting/audit-trail");
  revalidatePath("/accounting/reports");
  revalidatePath("/accounting/dashboard");
}

async function requireAccounting() {
  const user = await getAppUser();
  if (!user || user.role !== "accounting") {
    return { error: "Only accounting can manage journal entries.", user: null };
  }
  return { error: null, user };
}

function normalizeLines(lines: JournalLineInput[]) {
  return (lines ?? [])
    .map((line) => {
      const accountCode = line.accountCode?.trim() ?? "";
      const debit = roundMoney(Number(line.debit) || 0);
      const credit = roundMoney(Number(line.credit) || 0);
      return {
        accountCode,
        accountName: accountNameForCode(accountCode),
        description: line.description?.trim() ?? "",
        debit,
        credit,
      };
    })
    .filter(
      (line) =>
        line.accountCode.length > 0 && (line.debit > 0 || line.credit > 0),
    );
}

function validateEntry(input: JournalEntryInput):
  | { ok: true; lines: ReturnType<typeof normalizeLines>; status: JournalEntryStatus }
  | { ok: false; error: string } {
  const entryDate = input.entryDate?.trim() ?? "";
  const memo = input.memo?.trim() ?? "";
  const status = input.status;

  if (!entryDate) return { ok: false, error: "Enter an entry date." };
  if (!memo) return { ok: false, error: "Enter a memo." };
  if (!JOURNAL_ENTRY_STATUSES.includes(status)) {
    return { ok: false, error: "Select a valid status." };
  }

  const lines = normalizeLines(input.lines);
  if (lines.length < 2) {
    return {
      ok: false,
      error: "Add at least two lines with an account and a debit or credit.",
    };
  }

  for (const line of lines) {
    if (line.debit > 0 && line.credit > 0) {
      return {
        ok: false,
        error: "Each line can have either a debit or a credit, not both.",
      };
    }
    if (line.debit < 0 || line.credit < 0) {
      return { ok: false, error: "Debits and credits must be zero or greater." };
    }
  }

  const debitTotal = sumMoney(lines.map((l) => l.debit));
  const creditTotal = sumMoney(lines.map((l) => l.credit));
  if (status === "posted" && debitTotal !== creditTotal) {
    return {
      ok: false,
      error: `Posted entries must balance. Debits ${debitTotal.toFixed(2)} ≠ credits ${creditTotal.toFixed(2)}.`,
    };
  }
  if (debitTotal === 0 && creditTotal === 0) {
    return { ok: false, error: "Entry totals cannot both be zero." };
  }

  return { ok: true, lines, status };
}

export async function createJournalEntry(
  input: JournalEntryInput,
): Promise<ActionResult> {
  const { error: authError, user } = await requireAccounting();
  if (authError || !user) return { ok: false, error: authError ?? "Unauthorized" };

  const validated = validateEntry(input);
  if (!validated.ok) return validated;

  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data: entry, error } = await supabase
    .from("journal_entries")
    .insert({
      entry_date: input.entryDate.trim(),
      memo: input.memo.trim(),
      reference: input.reference?.trim() ?? "",
      status: validated.status,
      source_type: "manual",
      source_id: null,
      created_by: user.id,
      posted_at: validated.status === "posted" ? now : null,
      updated_at: now,
    })
    .select("id")
    .single();

  if (error || !entry) {
    return { ok: false, error: error?.message ?? "Could not create journal entry." };
  }

  const { error: linesError } = await supabase.from("journal_entry_lines").insert(
    validated.lines.map((line, index) => ({
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
    return { ok: false, error: linesError.message };
  }

  revalidateJournal(entry.id as string);
  return { ok: true, id: entry.id as string, message: "Journal entry created." };
}

export async function updateJournalEntry(
  id: string,
  input: JournalEntryInput,
): Promise<ActionResult> {
  const { error: authError } = await requireAccounting();
  if (authError) return { ok: false, error: authError };

  if (!id?.trim()) return { ok: false, error: "Missing journal entry id." };

  const validated = validateEntry(input);
  if (!validated.ok) return validated;

  const supabase = await createClient();
  const { data: existing, error: existingError } = await supabase
    .from("journal_entries")
    .select("id, status, posted_at")
    .eq("id", id)
    .maybeSingle();

  if (existingError || !existing) {
    return { ok: false, error: "Journal entry not found." };
  }

  const now = new Date().toISOString();
  const wasPosted = existing.status === "posted";
  const willPost = validated.status === "posted";
  const postedAt =
    willPost && !wasPosted
      ? now
      : willPost
        ? (existing.posted_at as string | null)
        : null;

  const { error: updateError } = await supabase
    .from("journal_entries")
    .update({
      entry_date: input.entryDate.trim(),
      memo: input.memo.trim(),
      reference: input.reference?.trim() ?? "",
      status: validated.status,
      posted_at: postedAt,
      updated_at: now,
    })
    .eq("id", id);

  if (updateError) return { ok: false, error: updateError.message };

  const { error: deleteError } = await supabase
    .from("journal_entry_lines")
    .delete()
    .eq("journal_entry_id", id);
  if (deleteError) return { ok: false, error: deleteError.message };

  const { error: linesError } = await supabase.from("journal_entry_lines").insert(
    validated.lines.map((line, index) => ({
      journal_entry_id: id,
      line_no: index + 1,
      account_code: line.accountCode,
      account_name: line.accountName,
      description: line.description,
      debit: line.debit,
      credit: line.credit,
    })),
  );
  if (linesError) return { ok: false, error: linesError.message };

  revalidateJournal(id);
  return { ok: true, id, message: "Journal entry updated." };
}

export async function deleteJournalEntry(id: string): Promise<ActionResult> {
  const { error: authError } = await requireAccounting();
  if (authError) return { ok: false, error: authError };

  if (!id?.trim()) return { ok: false, error: "Missing journal entry id." };

  const supabase = await createClient();
  const { error } = await supabase.from("journal_entries").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidateJournal();
  return { ok: true, id, message: "Journal entry deleted." };
}
