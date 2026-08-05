"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/** Print / Save as PDF controls for client invoice. */
export function InvoicePrintActions({ autoPrint }: { autoPrint?: boolean }) {
  useEffect(() => {
    if (!autoPrint) return;
    const t = window.setTimeout(() => {
      window.print();
    }, 400);
    return () => window.clearTimeout(t);
  }, [autoPrint]);

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <Button type="button" onClick={() => window.print()}>
        Download PDF / Print
      </Button>
      <Button type="button" variant="secondary" href="/client/invoices">
        Back to invoices
      </Button>
    </div>
  );
}
