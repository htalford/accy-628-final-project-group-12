import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";
type Size = "sm" | "md";

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--cf-navy)] text-white hover:bg-[var(--cf-navy-hover)] border-transparent",
  secondary:
    "bg-white text-[var(--cf-ink)] border border-[var(--cf-border)] hover:bg-[var(--cf-surface)]",
  ghost:
    "bg-transparent text-[var(--cf-ink)] border-transparent hover:bg-[var(--cf-surface)]",
  danger: "bg-red-600 text-white hover:bg-red-700 border-transparent",
  success:
    "bg-[var(--cf-accent)] text-white hover:opacity-90 border-transparent",
};

const sizes: Record<Size, string> = {
  sm: "px-2.5 py-1.5 text-xs",
  md: "px-3 py-2 text-sm",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  href,
  type = "button",
  disabled,
  className = "",
  onClick,
  ...props
}: {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  href?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
} & Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "type" | "onClick" | "disabled" | "className" | "children"
>) {
  const cls = `inline-flex items-center justify-center gap-1.5 rounded-md font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled}
      className={cls}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}
