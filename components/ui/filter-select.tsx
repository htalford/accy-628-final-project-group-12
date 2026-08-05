"use client";

export function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5 text-[11px] font-medium tracking-wide text-[var(--cf-muted)]">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full truncate rounded-lg border border-[var(--cf-border)] bg-white px-2.5 py-2 text-sm font-normal text-[var(--cf-ink)] shadow-sm outline-none transition hover:border-[var(--cf-accent)]/50 focus:border-[var(--cf-accent)] focus:ring-2 focus:ring-[var(--cf-accent)]/20"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
