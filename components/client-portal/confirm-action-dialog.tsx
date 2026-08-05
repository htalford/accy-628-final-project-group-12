"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { FieldTextarea, Label } from "@/components/ui/form";

export function ConfirmActionDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel,
  confirmVariant = "primary",
  requireReason = false,
  reasonLabel = "Reason (optional)",
  showReason = true,
  busy = false,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: "primary" | "danger" | "success" | "secondary";
  requireReason?: boolean;
  reasonLabel?: string;
  showReason?: boolean;
  busy?: boolean;
  onConfirm: (reason: string) => void | Promise<void>;
}) {
  const [reason, setReason] = useState("");

  async function handleConfirm() {
    if (requireReason && !reason.trim()) return;
    await onConfirm(reason.trim());
    setReason("");
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!busy) {
          setReason("");
          onClose();
        }
      }}
      title={title}
    >
      <p className="mb-4 text-sm text-[var(--cf-muted)]">{description}</p>
      {showReason ? (
        <div className="mb-4">
          <Label htmlFor="confirm-reason">
            {requireReason
              ? reasonLabel.replace("(optional)", "(required)")
              : reasonLabel}
          </Label>
          <FieldTextarea
            id="confirm-reason"
            rows={3}
            value={reason}
            disabled={busy}
            placeholder="Add a short note for the audit trail…"
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
      ) : null}
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={busy}
          onClick={() => {
            setReason("");
            onClose();
          }}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant={confirmVariant}
          disabled={busy || (requireReason && showReason && !reason.trim())}
          onClick={() => void handleConfirm()}
        >
          {busy ? "Working…" : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
