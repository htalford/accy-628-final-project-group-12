"use client";

import { PinTaskButton } from "@/components/portal-pins/pin-task-button";
import type { PinScope, PinnedTaskKind } from "@/lib/portal-pins";

/** Pin any action-queue / attention item to the portal sidebar. */
export function PinActionTaskButton({
  scope,
  id,
  title,
  detail,
  href,
  kind = "task",
}: {
  scope: PinScope;
  id: string;
  title: string;
  detail?: string;
  href: string;
  kind?: PinnedTaskKind;
}) {
  return (
    <PinTaskButton
      scope={scope}
      size="sm"
      task={{
        id: `${scope}-task-${id}`,
        label: title,
        sublabel: detail,
        href,
        kind,
      }}
    />
  );
}
