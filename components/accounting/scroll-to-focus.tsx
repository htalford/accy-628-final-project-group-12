"use client";

import { useEffect } from "react";

/** Scrolls a focused expense row into view after search deep-link navigation. */
export function ScrollToFocus({ focusId }: { focusId: string | undefined }) {
  useEffect(() => {
    if (!focusId) return;
    const el = document.getElementById(`expense-${focusId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focusId]);

  return null;
}
