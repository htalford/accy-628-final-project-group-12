"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { deleteInvoice } from "@/app/actions/invoice-mutations";

export function DeleteInvoiceButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <Button
        type="button"
        variant="danger"
        disabled={pending}
        onClick={() => {
          if (
            !window.confirm(
              "Delete this invoice permanently? Related payments and journal entries will also be removed.",
            )
          ) {
            return;
          }
          setError(null);
          startTransition(async () => {
            const result = await deleteInvoice(id);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            router.push("/accounting/invoices");
            router.refresh();
          });
        }}
      >
        {pending ? "Deleting…" : "Delete"}
      </Button>
    </div>
  );
}
