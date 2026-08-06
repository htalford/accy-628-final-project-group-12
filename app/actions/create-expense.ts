"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAppUser } from "@/lib/auth/get-app-user";
import {
  isRecognizedExpense,
  roundMoney,
} from "@/lib/accounting/calculations";
import {
  buildOperatingExpenseJournal,
  buildPlacementExpenseJournal,
} from "@/lib/accounting/journal-posting";
import { insertJournalDraft } from "@/lib/accounting/sync-journal-entries";
import {
  EXPENSE_TYPES,
  OPERATING_EXPENSE_CATEGORIES,
} from "@/lib/accounting/format";
import type {
  ExpenseStatus,
  ExpenseType,
  OperatingExpenseCategory,
} from "@/lib/types/database";

function revalidateExpensePaths(placementId?: string | null) {
  revalidatePath("/accounting/expenses");
  revalidatePath("/accounting/payroll");
  revalidatePath("/accounting/dashboard");
  revalidatePath("/accounting/profitability");
  revalidatePath("/accounting/audit-trail");
  revalidatePath("/accounting/journal-entries");
  revalidatePath("/accounting/reports");
  if (placementId) revalidatePath(`/accounting/contracts/${placementId}`);
}

export type CreateExpenseResult =
  | { ok: true; kind: "placement" | "operating"; id: string }
  | { ok: false; error: string };

const EXPENSE_STATUSES: ExpenseStatus[] = [
  "pending",
  "approved",
  "rejected",
  "reimbursed",
];

function firstOfMonth(dateIso: string): string {
  const d = new Date(`${dateIso}T00:00:00`);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

export async function createExpense(input: {
  kind: "placement" | "operating";
  description: string;
  amount: number;
  expenseDate: string;
  // placement
  placementId?: string | null;
  expenseType?: string | null;
  status?: string | null;
  // operating
  category?: string | null;
  month?: string | null;
}): Promise<CreateExpenseResult> {
  const user = await getAppUser();
  if (!user || (user.role !== "accounting" && user.role !== "recruiter")) {
    return { ok: false, error: "You do not have permission to create expenses." };
  }

  const description = input.description?.trim() ?? "";
  const expenseDate = input.expenseDate?.trim() ?? "";
  const amount = roundMoney(Number(input.amount));

  if (!description) {
    return { ok: false, error: "Enter a description." };
  }
  if (!expenseDate) {
    return { ok: false, error: "Enter an expense date." };
  }
  if (!Number.isFinite(amount) || amount < 0) {
    return { ok: false, error: "Amount must be zero or greater." };
  }

  const supabase = await createClient();

  if (input.kind === "placement") {
    const placementId = input.placementId?.trim() ?? "";
    const expenseType = input.expenseType?.trim() ?? "";
    const status = (input.status?.trim() || "pending") as ExpenseStatus;

    if (!placementId) {
      return { ok: false, error: "Select a contract / placement." };
    }
    if (!EXPENSE_TYPES.includes(expenseType as ExpenseType)) {
      return { ok: false, error: "Select a valid expense type." };
    }
    if (!EXPENSE_STATUSES.includes(status)) {
      return { ok: false, error: "Select a valid status." };
    }

    const { data: placement, error: placementError } = await supabase
      .from("placements")
      .select("id")
      .eq("id", placementId)
      .maybeSingle();
    if (placementError || !placement) {
      return { ok: false, error: "Selected placement was not found." };
    }

    const { data, error } = await supabase
      .from("expenses")
      .insert({
        placement_id: placementId,
        expense_type: expenseType,
        description,
        amount,
        expense_date: expenseDate,
        status,
      })
      .select("id")
      .single();

    if (error || !data) {
      return {
        ok: false,
        error: error?.message ?? "Could not create placement expense.",
      };
    }

    if (isRecognizedExpense(status)) {
      const draft = buildPlacementExpenseJournal({
        id: data.id as string,
        expenseType,
        description,
        amount,
        expenseDate,
        status,
      });
      if (draft) await insertJournalDraft(draft, user.id);
    }

    revalidateExpensePaths(placementId);
    return { ok: true, kind: "placement", id: data.id as string };
  }

  const category = input.category?.trim() ?? "";
  if (!OPERATING_EXPENSE_CATEGORIES.includes(category as OperatingExpenseCategory)) {
    return { ok: false, error: "Select a valid operating expense category." };
  }

  const status = (input.status?.trim() || "approved") as ExpenseStatus;
  if (!EXPENSE_STATUSES.includes(status)) {
    return { ok: false, error: "Select a valid status." };
  }

  const monthRaw = input.month?.trim() || expenseDate;
  const month = firstOfMonth(monthRaw.length === 7 ? `${monthRaw}-01` : monthRaw);

  const { data, error } = await supabase
    .from("operating_expenses")
    .insert({
      category,
      description,
      amount,
      expense_date: expenseDate,
      month,
      status,
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? "Could not create operating expense.",
    };
  }

  const draft = buildOperatingExpenseJournal({
    id: data.id as string,
    category,
    description,
    amount,
    expenseDate,
  });
  if (draft) await insertJournalDraft(draft, user.id);

  revalidateExpensePaths();
  return { ok: true, kind: "operating", id: data.id as string };
}
