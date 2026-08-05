"use client";

import { useState, useTransition } from "react";
import { applyToJob } from "@/app/actions/candidate";

export function ApplyButton({ jobId }: { jobId: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setMessage(null);
          startTransition(async () => {
            const result = await applyToJob(jobId);
            setMessage(result.ok ? "Application submitted." : result.error);
          });
        }}
        className="rounded-md bg-[var(--cf-navy)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--cf-navy-hover)] disabled:opacity-60"
      >
        {pending ? "Applying…" : "Apply"}
      </button>
      {message ? (
        <p className="max-w-40 text-right text-xs text-[var(--cf-muted)]">
          {message}
        </p>
      ) : null}
    </div>
  );
}
