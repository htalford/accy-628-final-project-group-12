export function StatusBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-[var(--cf-surface)] text-[var(--cf-ink)] border-[var(--cf-border)]",
    success: "bg-emerald-50 text-emerald-800 border-emerald-200",
    warning: "bg-amber-50 text-amber-900 border-amber-200",
    danger: "bg-red-50 text-red-800 border-red-200",
    info: "bg-sky-50 text-sky-900 border-sky-200",
  };
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {label}
    </span>
  );
}

export function statusTone(label: string): "neutral" | "success" | "warning" | "danger" | "info" {
  const l = label.toLowerCase();
  if (l.includes("paid") && !l.includes("partial") && !l.includes("unpaid"))
    return "success";
  if (l.includes("overdue") || l.includes("disputed") || l.includes("rejected"))
    return "danger";
  if (l.includes("pending") || l.includes("draft") || l.includes("partial") || l.includes("sent"))
    return "warning";
  if (l.includes("active") || l.includes("approved")) return "info";
  return "neutral";
}
