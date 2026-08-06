"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

export function CollapsiblePanel({
  id,
  title,
  description,
  action,
  defaultOpen = true,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const storageKey = `cf-expense-section-${id}`;
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved === "open") setOpen(true);
      if (saved === "closed") setOpen(false);
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  function toggle() {
    setOpen((prev) => {
      const next = !prev;
      try {
        sessionStorage.setItem(storageKey, next ? "open" : "closed");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-xl border border-[var(--cf-border)] bg-white p-4 shadow-sm sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <button
          type="button"
          onClick={toggle}
          className="flex min-w-0 flex-1 items-start gap-2 text-left"
          aria-expanded={open}
        >
          <span className="mt-0.5 text-[var(--cf-muted)]" aria-hidden>
            {open ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </span>
          <span>
            <span className="block text-sm font-semibold text-[var(--cf-ink)]">
              {title}
            </span>
            {description ? (
              <span className="mt-0.5 block text-xs text-[var(--cf-muted)]">
                {description}
              </span>
            ) : null}
          </span>
        </button>
        <div className="flex items-center gap-3">
          {action}
          <button
            type="button"
            onClick={toggle}
            className="rounded-md border border-[var(--cf-border)] px-2.5 py-1 text-xs font-medium text-[var(--cf-ink)] hover:bg-[var(--cf-surface)]"
          >
            {open ? "Hide" : "Show"}
          </button>
        </div>
      </div>
      {open ? <div className="mt-4">{children}</div> : null}
    </section>
  );
}
