import type { ReactNode, TableHTMLAttributes } from "react";

export function Table({
  children,
  className = "",
  ...props
}: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-[var(--cf-border)] bg-white shadow-sm">
      <table
        className={`w-full min-w-[640px] border-collapse text-left text-sm ${className}`}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-[var(--cf-border)] bg-[var(--cf-surface)] text-xs font-semibold tracking-wide text-[var(--cf-muted)] uppercase">
      {children}
    </thead>
  );
}

export function Th({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <th className={`px-4 py-3 font-semibold ${className}`}>{children}</th>;
}

export function Td({
  children,
  className = "",
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <td className={`border-t border-[var(--cf-border)] px-4 py-3 text-[var(--cf-ink)] ${className}`}>
      {children}
    </td>
  );
}
