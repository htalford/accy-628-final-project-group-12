"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { FireworksBackdrop } from "@/components/candidate/fireworks-backdrop";

const STORAGE_KEY = "tq-candidate-dismissed-offers";

export type OfferNotice = {
  id: string;
  title: string;
  employer: string;
  location: string | null;
  employmentType: string | null;
};

function readDismissed(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === "string"));
  } catch {
    return new Set();
  }
}

function writeDismissed(ids: Set<string>) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

export function OfferReceivedModal({ offers }: { offers: OfferNotice[] }) {
  const [open, setOpen] = useState(false);
  const [queue, setQueue] = useState<OfferNotice[]>([]);

  useEffect(() => {
    const dismissed = readDismissed();
    const remaining = offers.filter((o) => !dismissed.has(o.id));
    setQueue(remaining);
    setOpen(remaining.length > 0);
  }, [offers]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setQueue((prev) => {
        const current = prev[0];
        if (!current) {
          setOpen(false);
          return prev;
        }
        const dismissed = readDismissed();
        dismissed.add(current.id);
        writeDismissed(dismissed);
        const remaining = prev.slice(1);
        setOpen(remaining.length > 0);
        return remaining;
      });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const offer = queue[0] ?? null;

  function dismissCurrent() {
    if (!offer) {
      setOpen(false);
      return;
    }
    const dismissed = readDismissed();
    dismissed.add(offer.id);
    writeDismissed(dismissed);
    const remaining = queue.slice(1);
    setQueue(remaining);
    setOpen(remaining.length > 0);
  }

  if (!offer || !open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[var(--cf-ink)]/55"
        aria-label="Close dialog"
        onClick={dismissCurrent}
      />
      <FireworksBackdrop active={open} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="offer-modal-title"
        className="relative z-10 w-full max-w-lg rounded-xl border border-[var(--cf-border)] bg-white p-5 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2
            id="offer-modal-title"
            className="text-lg font-semibold text-[var(--cf-ink)]"
          >
            You’ve received an offer
          </h2>
          <button
            type="button"
            onClick={dismissCurrent}
            aria-label="Close"
            className="rounded-md p-1.5 text-[var(--cf-muted)] hover:bg-[var(--cf-surface)] hover:text-[var(--cf-ink)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-[var(--cf-muted)]">
            Great news — an employer extended an offer on one of your
            applications.
          </p>
          <div className="rounded-lg border border-[var(--cf-border)] bg-[var(--cf-surface)] px-4 py-3">
            <p className="text-base font-semibold text-[var(--cf-ink)]">
              {offer.title}
            </p>
            <p className="mt-1 text-sm capitalize text-[var(--cf-muted)]">
              {offer.employer}
              {offer.location ? ` · ${offer.location}` : ""}
              {offer.employmentType ? ` · ${offer.employmentType}` : ""}
            </p>
          </div>
          {queue.length > 1 ? (
            <p className="text-xs text-[var(--cf-muted)]">
              {queue.length - 1} more offer
              {queue.length - 1 === 1 ? "" : "s"} waiting after this one.
            </p>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={dismissCurrent}
              className="rounded-md border border-[var(--cf-border)] px-4 py-2 text-sm font-semibold text-[var(--cf-ink)] hover:bg-[var(--cf-surface)]"
            >
              Acknowledge
            </button>
            <Link
              href="/candidate/applications"
              onClick={dismissCurrent}
              className="inline-flex items-center justify-center rounded-md bg-[var(--cf-navy)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--cf-navy-hover)]"
            >
              View application
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
