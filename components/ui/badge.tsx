import type { ReactNode } from "react";

const tones: Record<string, string> = {
  default: "bg-[var(--cf-surface)] text-[var(--cf-ink)] border-[var(--cf-border)]",
  navy: "bg-[var(--cf-navy)]/10 text-[var(--cf-navy)] border-[var(--cf-navy)]/20",
  success: "bg-emerald-50 text-emerald-800 border-emerald-200",
  warning: "bg-amber-50 text-amber-900 border-amber-200",
  danger: "bg-red-50 text-red-800 border-red-200",
  muted: "bg-slate-100 text-slate-600 border-slate-200",
  accent: "bg-teal-50 text-teal-800 border-teal-200",
};

export function Badge({
  children,
  tone = "default",
  className = "",
}: {
  children: ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${tones[tone] ?? tones.default} ${className}`}
    >
      {children}
    </span>
  );
}

export function statusTone(status: string): keyof typeof tones {
  const s = status.toLowerCase();
  if (
    [
      "open",
      "active",
      "paid",
      "approved",
      "accepted",
      "on file",
      "filled",
      "completed",
    ].includes(s)
  )
    return "success";
  if (
    [
      "pending",
      "under review",
      "submitted",
      "interview",
      "offer",
      "in progress",
      "ending soon",
      "updated",
      "sent",
      "partial",
      "at risk",
    ].includes(s)
  )
    return "warning";
  if (
    [
      "overdue",
      "rejected",
      "cancelled",
      "closed",
      "on hold",
      "disputed",
    ].includes(s)
  )
    return "danger";
  if (["draft"].includes(s)) return "muted";
  return "navy";
}

