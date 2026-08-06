"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { respondToApplicationOutcome } from "@/app/actions/candidate";

export function ApplicationDecisionActions({
  applicationId,
  mode,
}: {
  applicationId: string;
  mode: "offer" | "rejected";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function respond(decision: "accepted" | "declined" | "acknowledged") {
    setError(null);
    startTransition(async () => {
      const result = await respondToApplicationOutcome({
        applicationId,
        decision,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="mt-2 space-y-1.5">
      {mode === "offer" ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => respond("accepted")}
            className="rounded-md bg-[var(--cf-navy)] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[var(--cf-navy-hover)] disabled:opacity-60"
          >
            Accept offer
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => respond("declined")}
            className="rounded-md border border-[var(--cf-border)] px-2.5 py-1.5 text-xs font-semibold text-[var(--cf-ink)] hover:bg-[var(--cf-surface)] disabled:opacity-60"
          >
            Decline offer
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => respond("acknowledged")}
          className="rounded-md border border-[var(--cf-border)] px-2.5 py-1.5 text-xs font-semibold text-[var(--cf-ink)] hover:bg-[var(--cf-surface)] disabled:opacity-60"
        >
          Acknowledge
        </button>
      )}
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
