"use client";

import { PinContractButton } from "@/components/portal-pins/pin-contract-button";
import { shortId } from "@/lib/accounting/format";

export function ContractPinCell({
  contractId,
  employeeName,
  clientName,
}: {
  contractId: string;
  employeeName: string;
  clientName?: string;
}) {
  return (
    <PinContractButton
      scope="accounting"
      contractId={contractId}
      contractNumber={shortId(contractId)}
      employeeName={employeeName}
      positionTitle={clientName}
    />
  );
}
