"use client";

import { PinTaskButton } from "@/components/portal-pins/pin-task-button";
import { makeContractPin, type PinScope } from "@/lib/portal-pins";

export function PinContractButton({
  scope,
  contractId,
  contractNumber,
  employeeName,
  positionTitle,
  size = "sm",
}: {
  scope: PinScope;
  contractId: string;
  contractNumber: string;
  employeeName?: string;
  positionTitle?: string;
  size?: "sm" | "md";
}) {
  const href =
    scope === "accounting"
      ? `/accounting/contracts/${contractId}`
      : `/client/contracts/${contractId}`;

  const sublabel = [employeeName, positionTitle].filter(Boolean).join(" · ");

  return (
    <PinTaskButton
      scope={scope}
      size={size}
      task={makeContractPin({
        scope,
        contractId,
        label: `Contract ${contractNumber}`,
        sublabel: sublabel || undefined,
        href,
      })}
    />
  );
}
