import Link from "next/link";

export function Button({
  children,
  variant = "primary",
  href,
  type = "button",
  disabled,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  href?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
}) {
  const base =
    "inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-semibold transition disabled:opacity-50";
  const variants = {
    primary:
      "bg-[var(--cf-navy)] text-white hover:bg-[var(--cf-navy-hover)]",
    secondary:
      "border border-[var(--cf-border)] bg-white text-[var(--cf-ink)] hover:bg-[var(--cf-surface)]",
    ghost: "text-[var(--cf-ink)] hover:bg-[var(--cf-surface)]",
  };
  const cls = `${base} ${variants[variant]} ${className}`;
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} disabled={disabled} className={cls} onClick={onClick}>
      {children}
    </button>
  );
}
