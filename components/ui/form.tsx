import type {
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-[var(--cf-border)]/60 ${className}`}
      aria-hidden
    />
  );
}

export function SectionSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

export function Label({
  children,
  htmlFor,
  id,
}: {
  children: ReactNode;
  htmlFor?: string;
  id?: string;
}) {
  return (
    <label
      id={id}
      htmlFor={htmlFor}
      className="mb-1.5 block text-xs font-semibold tracking-wide text-[var(--cf-muted)] uppercase"
    >
      {children}
    </label>
  );
}

export function FieldInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="w-full rounded-lg border border-[var(--cf-border)] bg-white px-3 py-2 text-sm text-[var(--cf-ink)] placeholder:text-[var(--cf-muted)] focus:border-[var(--cf-navy)] focus:ring-2 focus:ring-[var(--cf-navy)]/15 focus:outline-none disabled:bg-[var(--cf-surface)]"
      {...props}
    />
  );
}

export function FieldTextarea(
  props: TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  return (
    <textarea
      className="w-full rounded-lg border border-[var(--cf-border)] bg-white px-3 py-2 text-sm text-[var(--cf-ink)] placeholder:text-[var(--cf-muted)] focus:border-[var(--cf-navy)] focus:ring-2 focus:ring-[var(--cf-navy)]/15 focus:outline-none"
      {...props}
    />
  );
}

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-[var(--cf-border)]">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={`rounded-t-lg px-3 py-2 text-sm font-medium transition ${
            active === t.id
              ? "border-b-2 border-[var(--cf-navy)] text-[var(--cf-navy)]"
              : "text-[var(--cf-muted)] hover:text-[var(--cf-ink)]"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-3 pt-3 text-sm text-[var(--cf-muted)]">
      <span>
        Page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-lg border border-[var(--cf-border)] bg-white px-3 py-1.5 disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-lg border border-[var(--cf-border)] bg-white px-3 py-1.5 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
