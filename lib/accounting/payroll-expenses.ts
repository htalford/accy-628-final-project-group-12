import type {
  ExpenseType,
  OperatingExpenseCategory,
} from "@/lib/types/database";

/**
 * Operating expense categories that belong on the Payroll page
 * (staff pay recorded in public.operating_expenses).
 */
export const PAYROLL_OPERATING_CATEGORIES = [
  "recruiter_salaries",
  "accounting_salaries",
  "payroll",
  "employee_wages",
] as const satisfies readonly OperatingExpenseCategory[];

const payrollOperatingSet = new Set<string>(PAYROLL_OPERATING_CATEGORIES);

/**
 * Placement expense types for staffed employees that belong on Payroll
 * (public.expenses.expense_type).
 */
export const PAYROLL_PLACEMENT_EXPENSE_TYPES = [
  "benefits",
] as const satisfies readonly ExpenseType[];

export function isStaffedEmployeeBenefitsType(
  type: ExpenseType | string,
): boolean {
  return type === "benefits";
}

const payrollPlacementSet = new Set<string>(PAYROLL_PLACEMENT_EXPENSE_TYPES);

export function isPayrollOperatingCategory(
  category: OperatingExpenseCategory | string,
): boolean {
  return payrollOperatingSet.has(category);
}

export function isPayrollPlacementExpenseType(
  type: ExpenseType | string,
): boolean {
  return payrollPlacementSet.has(type);
}

export function isPayrollRelatedExpense(input: {
  kind: "operating" | "placement";
  categoryOrType: string;
}): boolean {
  return input.kind === "operating"
    ? isPayrollOperatingCategory(input.categoryOrType)
    : isPayrollPlacementExpenseType(input.categoryOrType);
}
