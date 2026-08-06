"use server";

import { revalidatePath } from "next/cache";
import { syncJournalEntriesFromOps } from "@/lib/accounting/sync-journal-entries";

function revalidateAll() {
  revalidatePath("/accounting/journal-entries");
  revalidatePath("/accounting/reports");
  revalidatePath("/accounting/dashboard");
  revalidatePath("/accounting/audit-trail");
  revalidatePath("/accounting/accounts-receivable");
  revalidatePath("/accounting/expenses");
  revalidatePath("/accounting/payroll");
  revalidatePath("/accounting/invoices");
}

export async function syncJournalEntriesAction() {
  const result = await syncJournalEntriesFromOps();
  revalidateAll();
  if (result.errors.length && result.created === 0) {
    return {
      ok: false as const,
      error: result.errors[0] ?? "Sync failed.",
      ...result,
    };
  }
  return {
    ok: true as const,
    message: `Synced ${result.created} new journal entr${result.created === 1 ? "y" : "ies"} (${result.skipped} already linked).`,
    ...result,
  };
}
