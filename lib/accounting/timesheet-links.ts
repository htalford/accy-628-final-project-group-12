/** Build filter query string shared by Timesheets ↔ Payroll. */
export function accountingTimesheetQuery(params: {
  period?: string | null;
  employee?: string | null;
  status?: string | null;
}): string {
  const qs = new URLSearchParams();
  if (params.period && params.period !== "all") qs.set("period", params.period);
  if (params.employee && params.employee !== "all") {
    qs.set("employee", params.employee);
  }
  if (params.status && params.status !== "all") qs.set("status", params.status);
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export function payrollHref(params: {
  period?: string | null;
  employee?: string | null;
  status?: string | null;
}): string {
  return `/accounting/payroll${accountingTimesheetQuery(params)}`;
}

export function timesheetsHref(params: {
  period?: string | null;
  employee?: string | null;
  status?: string | null;
}): string {
  return `/accounting/timesheets${accountingTimesheetQuery(params)}`;
}
