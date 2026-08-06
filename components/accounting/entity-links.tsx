import Link from "next/link";
import { shortId } from "@/lib/accounting/format";

export function EntityLink({
  href,
  children,
  mono = false,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`font-medium text-[var(--cf-ink)] underline-offset-2 hover:underline ${
        mono ? "font-mono text-xs" : "text-sm"
      } ${className}`}
    >
      {children}
    </Link>
  );
}

export function InvoiceLink({
  id,
  label,
}: {
  id: string;
  label?: string;
}) {
  return (
    <EntityLink href={`/accounting/invoices/${id}`} mono>
      {label ?? shortId(id)}
    </EntityLink>
  );
}

export function ContractLink({
  id,
  label,
}: {
  id: string;
  label?: string;
}) {
  return (
    <EntityLink href={`/accounting/contracts/${id}`} mono={!label}>
      {label ?? shortId(id)}
    </EntityLink>
  );
}

export function ClientArLink({
  clientId,
  name,
}: {
  clientId?: string | null;
  name: string;
}) {
  const href = clientId
    ? `/accounting/accounts-receivable?client=${clientId}`
    : "/accounting/accounts-receivable";
  return <EntityLink href={href}>{name}</EntityLink>;
}

export function PayrollEmployeeLink({
  name,
  employeeId,
}: {
  name: string;
  employeeId?: string | null;
}) {
  const href = employeeId
    ? `/accounting/employees/${employeeId}`
    : `/accounting/payroll?employee=${encodeURIComponent(name)}`;
  return <EntityLink href={href}>{name}</EntityLink>;
}

export function TimesheetLink({
  id,
  label,
}: {
  id: string;
  label?: string;
}) {
  return (
    <EntityLink href={`/accounting/timesheets/${id}`} mono>
      {label ?? shortId(id)}
    </EntityLink>
  );
}

export function TimesheetEmployeeLink({
  name,
  employeeId,
}: {
  name: string;
  employeeId?: string | null;
}) {
  const href = employeeId
    ? `/accounting/employees/${employeeId}`
    : `/accounting/timesheets?employee=${encodeURIComponent(name)}`;
  return <EntityLink href={href}>{name}</EntityLink>;
}
