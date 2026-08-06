import Link from "next/link";
import {
  ClipboardCheck,
  FileWarning,
  Receipt,
  Users,
} from "lucide-react";

export type StaffingHealthItem = {
  id: string;
  label: string;
  value: number | string;
  detail: string;
  href: string;
  tone: "ok" | "warn" | "critical" | "info";
};

const toneStyles: Record<
  StaffingHealthItem["tone"],
  { border: string; bg: string; value: string; icon: string }
> = {
  ok: {
    border: "border-emerald-200",
    bg: "bg-emerald-50/50",
    value: "text-emerald-900",
    icon: "text-emerald-700",
  },
  info: {
    border: "border-[var(--cf-border)]",
    bg: "bg-white",
    value: "text-[var(--cf-navy)]",
    icon: "text-[var(--cf-navy)]",
  },
  warn: {
    border: "border-amber-200",
    bg: "bg-amber-50/60",
    value: "text-amber-950",
    icon: "text-amber-700",
  },
  critical: {
    border: "border-rose-200",
    bg: "bg-rose-50/50",
    value: "text-rose-900",
    icon: "text-rose-700",
  },
};

const ICONS = {
  roles: FileWarning,
  candidates: Users,
  timesheets: ClipboardCheck,
  invoices: Receipt,
} as const;

/** Horizontal snapshot strip for the client dashboard. */
export function StaffingHealthStrip({
  items,
}: {
  items: Array<StaffingHealthItem & { icon?: keyof typeof ICONS }>;
}) {
  return (
    <section aria-label="Staffing health">
      <div className="mb-2 flex items-end justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-[var(--cf-ink)]">
            Snapshot
          </h2>
          <p className="text-sm text-[var(--cf-muted)]">
            Counts that typically need a decision soon.
          </p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => {
          const styles = toneStyles[item.tone];
          const Icon = ICONS[item.icon ?? "roles"] ?? FileWarning;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`group rounded-xl border ${styles.border} ${styles.bg} p-4 shadow-sm transition hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cf-navy)]`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold tracking-wide text-[var(--cf-muted)] uppercase">
                  {item.label}
                </p>
                <Icon
                  className={`h-4 w-4 shrink-0 ${styles.icon}`}
                  aria-hidden
                />
              </div>
              <p
                className={`mt-2 text-3xl font-semibold tracking-tight ${styles.value}`}
              >
                {item.value}
              </p>
              <p className="mt-1 text-xs leading-snug text-[var(--cf-muted)] group-hover:text-[var(--cf-ink)]">
                {item.detail}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
