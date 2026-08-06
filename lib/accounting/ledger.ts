import "server-only";

import { createClient } from "@/lib/supabase/server";
import { roundMoney, sumMoney } from "@/lib/accounting/calculations";
import type { JournalEntrySourceType } from "@/lib/types/database";

export type PostedJournalLine = {
  entryId: string;
  entryDate: string;
  sourceType: JournalEntrySourceType;
  sourceId: string | null;
  accountCode: string;
  debit: number;
  credit: number;
};

function inDateRange(
  date: string | null | undefined,
  from?: string | null,
  to?: string | null,
): boolean {
  if (!date) return !(from || to);
  const d = date.slice(0, 10);
  if (from && d < from) return false;
  if (to && d > to) return false;
  return true;
}

/** All posted journal lines (optionally filtered by entry date and/or source ids). */
export async function getPostedJournalLines(options?: {
  from?: string | null;
  to?: string | null;
  sourceIds?: Set<string> | null;
  asOf?: string | null;
}): Promise<PostedJournalLine[]> {
  const supabase = await createClient();
  const { data: entries, error } = await supabase
    .from("journal_entries")
    .select("id, entry_date, source_type, source_id, status")
    .eq("status", "posted")
    .order("entry_date", { ascending: true });

  if (error) {
    console.error("getPostedJournalLines entries", error.message);
    return [];
  }

  const filteredEntries = (entries ?? []).filter((e) => {
    const date = e.entry_date as string;
    if (options?.asOf && date > options.asOf) return false;
    if (!options?.asOf && !inDateRange(date, options?.from, options?.to)) {
      return false;
    }
    if (options?.sourceIds && options.sourceIds.size > 0) {
      const sid = e.source_id as string | null;
      if (!sid || !options.sourceIds.has(sid)) return false;
    }
    return true;
  });

  const ids = filteredEntries.map((e) => e.id as string);
  if (ids.length === 0) return [];

  const { data: lines, error: linesError } = await supabase
    .from("journal_entry_lines")
    .select("journal_entry_id, account_code, debit, credit")
    .in("journal_entry_id", ids);

  if (linesError) {
    console.error("getPostedJournalLines lines", linesError.message);
    return [];
  }

  const entryById = new Map(
    filteredEntries.map((e) => [e.id as string, e]),
  );

  return (lines ?? []).map((l) => {
    const entry = entryById.get(l.journal_entry_id as string)!;
    return {
      entryId: entry.id as string,
      entryDate: entry.entry_date as string,
      sourceType: entry.source_type as JournalEntrySourceType,
      sourceId: (entry.source_id as string | null) ?? null,
      accountCode: l.account_code as string,
      debit: Number(l.debit ?? 0),
      credit: Number(l.credit ?? 0),
    };
  });
}

export function netDebit(
  lines: PostedJournalLine[],
  codes: string[],
  sourceTypes?: JournalEntrySourceType[],
): number {
  const codeSet = new Set(codes);
  const sourceSet = sourceTypes ? new Set(sourceTypes) : null;
  return roundMoney(
    sumMoney(
      lines
        .filter(
          (l) =>
            codeSet.has(l.accountCode) &&
            (!sourceSet || sourceSet.has(l.sourceType)),
        )
        .map((l) => l.debit - l.credit),
    ),
  );
}

export function netCredit(
  lines: PostedJournalLine[],
  codes: string[],
  sourceTypes?: JournalEntrySourceType[],
): number {
  return roundMoney(-netDebit(lines, codes, sourceTypes));
}

/** Cash inflows to account 1000 that clear AR (customer collections). */
export function cashFromCustomers(lines: PostedJournalLine[]): number {
  // Sum debits to cash on payment-sourced entries.
  return roundMoney(
    sumMoney(
      lines
        .filter(
          (l) =>
            l.sourceType === "payment" &&
            l.accountCode === "1000" &&
            l.debit > 0,
        )
        .map((l) => l.debit),
    ),
  );
}

/** Cash outflows from account 1000 for expenses. */
export function cashPaidForExpenses(lines: PostedJournalLine[]): number {
  return roundMoney(
    sumMoney(
      lines
        .filter(
          (l) =>
            l.accountCode === "1000" &&
            l.credit > 0 &&
            (l.sourceType === "expense" ||
              l.sourceType === "operating_expense"),
        )
        .map((l) => l.credit),
    ),
  );
}
