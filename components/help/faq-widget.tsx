"use client";

import { useEffect, useId, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, CircleHelp, X } from "lucide-react";
import { getFaqsForRole } from "@/lib/help/faq-content";
import { ROLE_LABELS } from "@/lib/auth/roles";
import type { UserRole } from "@/lib/types/database";

export function FaqWidget({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const titleId = useId();
  const items = getFaqsForRole(role, pathname);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    setExpandedId(null);
  }, [role, pathname]);

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-40 flex flex-col items-end gap-2">
      {open ? (
        <div
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
          className="pointer-events-auto flex max-h-[min(28rem,70vh)] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-[var(--cf-border)] bg-white shadow-lg"
        >
          <div className="flex items-start justify-between gap-2 border-b border-[var(--cf-border)] bg-[var(--cf-navy)] px-3 py-2.5 text-white">
            <div className="min-w-0">
              <p id={titleId} className="text-sm font-semibold">
                Help & FAQ
              </p>
              <p className="text-xs text-white/75">
                {ROLE_LABELS[role]} portal · quick answers
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md p-1 text-white/90 hover:bg-white/10"
              aria-label="Close help"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <ul className="min-h-0 flex-1 overflow-y-auto divide-y divide-[var(--cf-border)]">
            {items.map((item) => {
              const isOpen = expandedId === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() =>
                      setExpandedId((id) => (id === item.id ? null : item.id))
                    }
                    className="flex w-full items-start gap-2 px-3 py-2.5 text-left hover:bg-[var(--cf-surface)]"
                  >
                    <span className="min-w-0 flex-1 text-sm font-medium text-[var(--cf-ink)]">
                      {item.question}
                    </span>
                    <ChevronDown
                      className={`mt-0.5 h-4 w-4 shrink-0 text-[var(--cf-muted)] transition ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isOpen ? (
                    <p className="px-3 pb-3 text-sm leading-relaxed text-[var(--cf-muted)]">
                      {item.answer}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>

          <p className="border-t border-[var(--cf-border)] bg-[var(--cf-surface)] px-3 py-2 text-[11px] text-[var(--cf-muted)]">
            Static help only — no live chat or AI.
          </p>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close help" : "Open help FAQ"}
        className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--cf-navy)] text-white shadow-lg ring-2 ring-white/80 transition hover:bg-[var(--cf-navy-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cf-accent)]"
      >
        {open ? <X className="h-5 w-5" /> : <CircleHelp className="h-5 w-5" />}
      </button>
    </div>
  );
}
