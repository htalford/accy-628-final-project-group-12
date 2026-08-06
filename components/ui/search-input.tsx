import { Search } from "lucide-react";
import type { InputHTMLAttributes } from "react";

type SearchInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  size?: "md" | "lg";
};

export function SearchInput({
  className = "",
  size = "md",
  ...props
}: SearchInputProps) {
  const large = size === "lg";

  return (
    <div className={`relative ${className}`}>
      <Search
        className={`pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[var(--cf-muted)] ${
          large ? "h-[18px] w-[18px]" : "h-4 w-4"
        }`}
        aria-hidden
      />
      <input
        type="search"
        className={`w-full rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-ink)] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition placeholder:text-[var(--cf-muted)] focus:border-[var(--cf-accent)] focus:bg-white focus:ring-2 focus:ring-[var(--cf-accent)]/20 focus:outline-none ${
          large
            ? "py-3 pr-4 pl-11 text-[15px] leading-snug"
            : "py-2 pr-3 pl-9 text-sm"
        }`}
        {...props}
      />
    </div>
  );
}
