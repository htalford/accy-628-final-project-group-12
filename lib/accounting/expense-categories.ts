import type {
  ExpenseType,
  OperatingExpenseCategory,
} from "@/lib/types/database";

export type GeneralizedExpenseGroup = {
  value: string;
  label: string;
  /** Underlying DB enum values included in this group. */
  dbValues: string[];
  /** Value stored when creating a new expense in this group. */
  storeAs: string;
};

/** Payroll Expenses section (staff pay operating categories). */
export const GENERALIZED_PAYROLL_CATEGORIES: GeneralizedExpenseGroup[] = [
  {
    value: "staff_salaries",
    label: "Staff Salaries",
    dbValues: ["recruiter_salaries", "accounting_salaries"],
    storeAs: "recruiter_salaries",
  },
  {
    value: "wages",
    label: "Wages & Payroll",
    dbValues: ["payroll", "employee_wages"],
    storeAs: "payroll",
  },
];

/** Operating Expenses section (non-payroll overhead). */
export const GENERALIZED_OPERATING_CATEGORIES: GeneralizedExpenseGroup[] = [
  {
    value: "facilities",
    label: "Facilities",
    dbValues: ["office_rent"],
    storeAs: "office_rent",
  },
  {
    value: "technology",
    label: "Technology",
    dbValues: ["software_tools"],
    storeAs: "software_tools",
  },
  {
    value: "marketing",
    label: "Marketing",
    dbValues: ["marketing", "advertising"],
    storeAs: "marketing",
  },
  {
    value: "screening",
    label: "Screening & Compliance",
    dbValues: ["background_checks", "drug_screening"],
    storeAs: "background_checks",
  },
  {
    value: "people",
    label: "Training & Bonuses",
    dbValues: ["training", "referral_bonuses", "recruiter_labor"],
    storeAs: "training",
  },
  {
    value: "other_operating",
    label: "Other Operating",
    dbValues: ["other"],
    storeAs: "other",
  },
];

/** Placement Expenses section. */
export const GENERALIZED_PLACEMENT_CATEGORIES: GeneralizedExpenseGroup[] = [
  {
    value: "labor",
    label: "Labor Costs",
    dbValues: ["payroll_tax", "workers_comp"],
    storeAs: "payroll_tax",
  },
  {
    value: "benefits",
    label: "Benefits",
    dbValues: ["benefits"],
    storeAs: "benefits",
  },
  {
    value: "recruiting",
    label: "Recruiting",
    dbValues: ["recruiting_cost"],
    storeAs: "recruiting_cost",
  },
  {
    value: "travel_equipment",
    label: "Travel & Equipment",
    dbValues: ["travel", "equipment"],
    storeAs: "travel",
  },
  {
    value: "other_placement",
    label: "Other Placement",
    dbValues: ["other"],
    storeAs: "other",
  },
];

const operatingGroupByDb = new Map<string, GeneralizedExpenseGroup>();
for (const group of [
  ...GENERALIZED_PAYROLL_CATEGORIES,
  ...GENERALIZED_OPERATING_CATEGORIES,
]) {
  for (const db of group.dbValues) operatingGroupByDb.set(db, group);
}

const placementGroupByDb = new Map<string, GeneralizedExpenseGroup>();
for (const group of GENERALIZED_PLACEMENT_CATEGORIES) {
  for (const db of group.dbValues) placementGroupByDb.set(db, group);
}

export function generalizedOperatingCategoryLabel(
  category: OperatingExpenseCategory | string,
): string {
  return (
    operatingGroupByDb.get(category)?.label ??
    String(category).replaceAll("_", " ")
  );
}

export function generalizedPlacementCategoryLabel(
  type: ExpenseType | string,
): string {
  return (
    placementGroupByDb.get(type)?.label ?? String(type).replaceAll("_", " ")
  );
}

export function findExpenseCategoryGroup(
  filterValue: string,
): GeneralizedExpenseGroup | undefined {
  return [
    ...GENERALIZED_PAYROLL_CATEGORIES,
    ...GENERALIZED_OPERATING_CATEGORIES,
    ...GENERALIZED_PLACEMENT_CATEGORIES,
  ].find((g) => g.value === filterValue);
}

export function isPlacementCategoryFilter(filterValue: string): boolean {
  return GENERALIZED_PLACEMENT_CATEGORIES.some((g) => g.value === filterValue);
}

export function operatingDbValuesForFilter(filterValue: string): string[] | null {
  const group = [
    ...GENERALIZED_PAYROLL_CATEGORIES,
    ...GENERALIZED_OPERATING_CATEGORIES,
  ].find((g) => g.value === filterValue);
  return group ? group.dbValues : null;
}

export function placementDbValuesForFilter(filterValue: string): string[] | null {
  const group = GENERALIZED_PLACEMENT_CATEGORIES.find(
    (g) => g.value === filterValue,
  );
  return group ? group.dbValues : null;
}

/** Categories currently present in expense data, sorted by label. */
export function usedExpenseCategoryOptions(input: {
  operatingCategories: string[];
  placementTypes: string[];
}): { value: string; label: string }[] {
  const used = new Map<string, string>();

  for (const category of input.operatingCategories) {
    const group = operatingGroupByDb.get(category);
    if (group) used.set(group.value, group.label);
  }
  for (const type of input.placementTypes) {
    const group = placementGroupByDb.get(type);
    if (group) used.set(group.value, group.label);
  }

  return [...used.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
