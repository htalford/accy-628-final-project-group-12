"use client";

import { Pin, PinOff } from "lucide-react";
import { usePinnedTasks } from "@/components/portal-pins/use-pinned-tasks";
import type { PinScope, PinnedTask } from "@/lib/portal-pins";

export function PinTaskButton({
  scope,
  task,
  size = "md",
  className = "",
}: {
  scope: PinScope;
  task: PinnedTask;
  size?: "sm" | "md";
  className?: string;
}) {
  const { ready, isPinned, toggle } = usePinnedTasks(scope);
  const pinned = isPinned(task.id);
  const dim = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  if (!ready) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-md border border-transparent p-1.5 opacity-0 ${className}`}
        aria-hidden
      >
        <Pin className={dim} />
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(task);
      }}
      title={pinned ? `Unpin: ${task.label}` : `Pin to sidebar: ${task.label}`}
      aria-label={
        pinned ? `Unpin ${task.label}` : `Pin ${task.label} to sidebar`
      }
      aria-pressed={pinned}
      className={`inline-flex items-center justify-center rounded-md border p-1.5 transition ${
        pinned
          ? "border-[var(--cf-accent)]/40 bg-[var(--cf-accent)]/10 text-[var(--cf-navy)]"
          : "border-[var(--cf-border)] text-[var(--cf-muted)] hover:border-[var(--cf-navy)]/30 hover:text-[var(--cf-navy)]"
      } ${className}`}
    >
      {pinned ? (
        <Pin className={`${dim} fill-current`} aria-hidden />
      ) : (
        <PinOff className={dim} aria-hidden />
      )}
    </button>
  );
}
