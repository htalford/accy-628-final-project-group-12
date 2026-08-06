export type ChartAccount = {
  code: string;
  name: string;
  type: "asset" | "liability" | "equity" | "revenue" | "expense";
};

/** Demo chart of accounts for TalentQuest journal entries. */
export const CHART_OF_ACCOUNTS: ChartAccount[] = [
  { code: "1000", name: "Cash", type: "asset" },
  { code: "1200", name: "Accounts Receivable", type: "asset" },
  { code: "1500", name: "Prepaid Expenses", type: "asset" },
  { code: "2100", name: "Accrued Payroll", type: "liability" },
  { code: "2200", name: "Accrued Expenses", type: "liability" },
  { code: "2300", name: "Accounts Payable", type: "liability" },
  { code: "3000", name: "Owner Equity", type: "equity" },
  { code: "4000", name: "Contract Revenue", type: "revenue" },
  { code: "4100", name: "Permanent Placement Fees", type: "revenue" },
  { code: "5100", name: "Contract Labor Expense", type: "expense" },
  { code: "5200", name: "Recruiting Expense", type: "expense" },
  { code: "5300", name: "Payroll Tax Expense", type: "expense" },
  { code: "6100", name: "Rent Expense", type: "expense" },
  { code: "6200", name: "Software Expense", type: "expense" },
  { code: "6300", name: "Marketing Expense", type: "expense" },
  { code: "6900", name: "Other Operating Expense", type: "expense" },
];

export function accountNameForCode(code: string): string {
  return CHART_OF_ACCOUNTS.find((a) => a.code === code)?.name ?? code;
}

export function accountLabel(code: string, name?: string): string {
  const resolved = name?.trim() || accountNameForCode(code);
  return `${code} · ${resolved}`;
}
