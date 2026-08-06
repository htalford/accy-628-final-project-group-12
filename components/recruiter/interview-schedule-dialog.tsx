"use client";

import { useMemo, useState } from "react";

export type InterviewSlot = {
  id: string;
  iso: string;
  label: string;
};

/** Next several business-day morning/afternoon slots for recruiters to pick from. */
export function buildInterviewSlots(count = 8): InterviewSlot[] {
  const slots: InterviewSlot[] = [];
  const hours = [9, 10, 11, 13, 14, 15];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() + 1);

  while (slots.length < count) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) {
      for (const hour of hours) {
        if (slots.length >= count) break;
        const dt = new Date(cursor);
        dt.setHours(hour, 0, 0, 0);
        const id = dt.toISOString();
        slots.push({
          id,
          iso: id,
          label: dt.toLocaleString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          }),
        });
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return slots;
}

export function InterviewScheduleDialog({
  candidateName,
  open,
  busy,
  onClose,
  onConfirm,
}: {
  candidateName: string;
  open: boolean;
  busy?: boolean;
  onClose: () => void;
  onConfirm: (input: {
    datetime: string;
    interviewType: string;
    notes?: string;
  }) => void | Promise<void>;
}) {
  const slots = useMemo(() => buildInterviewSlots(10), []);
  const [slotId, setSlotId] = useState(slots[0]?.id ?? "");
  const [interviewType, setInterviewType] = useState("Virtual");
  const [notes, setNotes] = useState("");

  if (!open) return null;

  const selected = slots.find((s) => s.id === slotId) ?? slots[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--cf-border)] bg-white p-5 shadow-lg">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-[var(--cf-ink)]">
              Schedule interview
            </h3>
            <p className="mt-1 text-xs text-[var(--cf-muted)]">
              {candidateName} · choose an available date and time, then confirm.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="text-sm text-[var(--cf-muted)] hover:text-[var(--cf-ink)]"
          >
            Close
          </button>
        </div>

        <fieldset className="max-h-48 space-y-1.5 overflow-y-auto rounded-lg border border-[var(--cf-border)] p-2">
          <legend className="px-1 text-[10px] font-semibold tracking-wide text-[var(--cf-muted)] uppercase">
            Available times
          </legend>
          {slots.map((slot) => (
            <label
              key={slot.id}
              className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm ${
                slotId === slot.id
                  ? "bg-[var(--cf-navy)]/10 text-[var(--cf-navy)]"
                  : "hover:bg-[var(--cf-surface)]"
              }`}
            >
              <input
                type="radio"
                name="interview-slot"
                checked={slotId === slot.id}
                onChange={() => setSlotId(slot.id)}
                disabled={busy}
                className="h-3.5 w-3.5"
              />
              {slot.label}
            </label>
          ))}
        </fieldset>

        <label className="mt-3 block text-xs font-medium text-[var(--cf-muted)]">
          Interview type
          <select
            value={interviewType}
            disabled={busy}
            onChange={(e) => setInterviewType(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--cf-border)] px-3 py-2 text-sm text-[var(--cf-ink)]"
          >
            <option>Virtual</option>
            <option>Phone</option>
            <option>In Person</option>
          </select>
        </label>

        <label className="mt-3 block text-xs font-medium text-[var(--cf-muted)]">
          Notes (optional)
          <textarea
            value={notes}
            disabled={busy}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-[var(--cf-border)] px-3 py-2 text-sm"
            placeholder="Join link, interviewer, etc."
          />
        </label>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="rounded-lg border border-[var(--cf-border)] px-3 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy || !selected}
            onClick={() => {
              if (!selected) return;
              void onConfirm({
                datetime: selected.iso,
                interviewType,
                notes: notes.trim() || undefined,
              });
            }}
            className="rounded-lg bg-[var(--cf-navy)] px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Confirm interview
          </button>
        </div>
      </div>
    </div>
  );
}
