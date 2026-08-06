"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { FireworksBackdrop } from "@/components/candidate/fireworks-backdrop";
import { respondToApplicationOutcome } from "@/app/actions/candidate";

export type OfferNotice = {
  id: string;
  title: string;
  employer: string;
  location: string | null;
  employmentType: string | null;
};

/**
 * Celebratory offer popup. Closing it only hides for this session —
 * it returns on the next visit until the candidate accepts or declines.
 */
export function OfferReceivedModal({ offers }: { offers: OfferNotice[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [queue, setQueue] = useState<OfferNotice[]>([]);
  const [sessionHidden, setSessionHidden] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const remaining = offers.filter((o) => !sessionHidden.has(o.id));
    setQueue(remaining);
    setOpen(remaining.length > 0);
  }, [offers, sessionHidden]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") hideForNow();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, queue]);

  const offer = queue[0] ?? null;

  function hideForNow() {
    if (!offer) {
      setOpen(false);
      return;
    }
    setSessionHidden((prev) => new Set(prev).add(offer.id));
    setError(null);
  }

  function respond(decision: "accepted" | "declined") {
    if (!offer) return;
    setError(null);
    startTransition(async () => {
      const result = await respondToApplicationOutcome({
        applicationId: offer.id,
        decision,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSessionHidden((prev) => new Set(prev).add(offer.id));
      router.refresh();
    });
  }

  if (!offer || !open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[var(--cf-ink)]/55"
        aria-label="Close dialog"
        onClick={hideForNow}
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
            onClick={hideForNow}
            aria-label="Close"
            className="rounded-md p-1.5 text-[var(--cf-muted)] hover:bg-[var(--cf-surface)] hover:text-[var(--cf-ink)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-[var(--cf-muted)]">
            Great news — accept or decline this offer. It will stay in your
            notification bell until you respond.
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
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={hideForNow}
              className="rounded-md border border-[var(--cf-border)] px-4 py-2 text-sm font-semibold text-[var(--cf-ink)] hover:bg-[var(--cf-surface)] disabled:opacity-60"
            >
              Remind me later
            </button>
            <Link
              href={`/candidate/applications?app=${offer.id}`}
              onClick={hideForNow}
              className="inline-flex items-center justify-center rounded-md border border-[var(--cf-border)] px-4 py-2 text-sm font-semibold text-[var(--cf-ink)] hover:bg-[var(--cf-surface)]"
            >
              View application
            </Link>
            <button
              type="button"
              disabled={pending}
              onClick={() => respond("declined")}
              className="rounded-md border border-[var(--cf-border)] px-4 py-2 text-sm font-semibold text-[var(--cf-ink)] hover:bg-[var(--cf-surface)] disabled:opacity-60"
            >
              Decline
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => respond("accepted")}
              className="rounded-md bg-[var(--cf-navy)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--cf-navy-hover)] disabled:opacity-60"
            >
              Accept offer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
