"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

export type NavDropdownItem = {
  href: string;
  label: string;
  description?: string;
};

export function NavDropdown({
  label,
  items,
}: {
  label: string;
  items: NavDropdownItem[];
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-semibold text-[var(--ot-navy)] transition hover:bg-[var(--ot-mist)] hover:text-[var(--ot-ocean)]"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        {label}
        <ChevronDown
          className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute left-0 top-full z-40 w-72 rounded-xl border border-[var(--ot-border)] bg-white p-2 shadow-lg shadow-[var(--ot-navy)]/10"
        >
          {items.map((item) => (
            <Link
              key={item.href + item.label}
              href={item.href}
              role="menuitem"
              className="block rounded-lg px-3 py-2.5 transition hover:bg-[var(--ot-mist)]"
              onClick={() => setOpen(false)}
            >
              <span className="block text-sm font-semibold text-[var(--ot-navy)]">
                {item.label}
              </span>
              {item.description ? (
                <span className="mt-0.5 block text-xs leading-snug text-[var(--ot-muted)]">
                  {item.description}
                </span>
              ) : null}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
