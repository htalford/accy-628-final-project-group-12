"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { deleteJournalEntry } from "@/app/actions/journal-entries";

export function DeleteJournalEntryButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {error ? (
        <p className="text-sm text-red-700">{error}</p>
      ) : null}
      <Button
        type="button"
        variant="danger"
        disabled={pending}
        onClick={() => {
          if (
            !window.confirm(
              "Delete this journal entry permanently? This cannot be undone.",
            )
          ) {
            return;
          }
          setError(null);
          startTransition(async () => {
            const result = await deleteJournalEntry(id);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            router.push("/accounting/journal-entries");
            router.refresh();
          });
        }}
      >
        {pending ? "Deleting…" : "Delete entry"}
      </Button>
    </div>
  );
}
