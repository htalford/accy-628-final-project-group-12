"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

/** Scrolls to and briefly highlights an application row from ?app=id. */
export function ApplicationFocus({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useSearchParams();
  const appId = params.get("app")?.trim() || null;

  useEffect(() => {
    if (!appId) return;
    const el = document.getElementById(`application-${appId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add(
      "ring-2",
      "ring-[var(--cf-accent)]",
      "ring-offset-2",
      "bg-[var(--cf-accent)]/5",
    );
    const timer = window.setTimeout(() => {
      el.classList.remove(
        "ring-2",
        "ring-[var(--cf-accent)]",
        "ring-offset-2",
        "bg-[var(--cf-accent)]/5",
      );
    }, 3200);
    return () => window.clearTimeout(timer);
  }, [appId]);

  return <>{children}</>;
}
