"use client";

import { useEffect, useState, useTransition } from "react";
import { toggleJobInterest } from "@/app/actions/candidate";

type Props = {
  jobId: string;
  interested: boolean;
  jobTitle?: string;
};

export function InterestedButton({ jobId, interested, jobTitle }: Props) {
  const [on, setOn] = useState(interested);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setOn(interested);
  }, [interested]);

  function handleToggle() {
    const next = !on;
    setOn(next);
    setError(null);
    startTransition(async () => {
      const result = await toggleJobInterest(jobId, next);
      if (!result.ok) {
        setOn(!next);
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col items-center gap-0.5">
      <button
        type="button"
        onClick={handleToggle}
        disabled={pending}
        aria-pressed={on}
        aria-label={
          on
            ? `Remove interest${jobTitle ? ` in ${jobTitle}` : ""}`
            : `Mark interested${jobTitle ? ` in ${jobTitle}` : ""}`
        }
        title={on ? "Interested — click to remove" : "Mark as interested"}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-base leading-none transition disabled:opacity-60 ${
          on
            ? "bg-[var(--cf-accent)]/15 ring-1 ring-[var(--cf-accent)]/40"
            : "hover:bg-[var(--cf-surface)]"
        }`}
      >
        <span aria-hidden className={on ? "opacity-100" : "opacity-45 grayscale"}>
          👍
        </span>
      </button>
      {error ? (
        <p className="max-w-[6rem] text-center text-[10px] text-red-600">{error}</p>
      ) : null}
    </div>
  );
}
