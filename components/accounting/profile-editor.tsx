"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/accounting/panel";

export function ProfileEditor({
  name,
  email,
  roleLabel,
}: {
  name: string;
  email: string;
  roleLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [draftName, setDraftName] = useState(name);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyPayroll, setNotifyPayroll] = useState(true);
  const [notifyOverdue, setNotifyOverdue] = useState(true);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  return (
    <Panel
      title="Notification Preferences"
      action={
        <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
          Edit Profile
        </Button>
      }
    >
      <ul className="space-y-2 text-sm text-[var(--cf-ink)]">
        <li>Email notifications: {notifyEmail ? "On" : "Off"}</li>
        <li>Payroll reminders: {notifyPayroll ? "On" : "Off"}</li>
        <li>Overdue invoice alerts: {notifyOverdue ? "On" : "Off"}</li>
      </ul>
      {savedMsg ? (
        <p className="mt-3 text-xs text-[var(--cf-accent)]">{savedMsg}</p>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-[var(--cf-border)] bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-[var(--cf-ink)]">
              Edit Profile
            </h3>
            <p className="mt-1 text-xs text-[var(--cf-muted)]">
              Changes are local only — not written to Supabase yet.
            </p>
            <div className="mt-4 space-y-3">
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Name</span>
                <input
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  className="w-full rounded-md border border-[var(--cf-border)] px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Email</span>
                <input
                  value={email}
                  disabled
                  className="w-full rounded-md border border-[var(--cf-border)] bg-[var(--cf-surface)] px-3 py-2"
                />
              </label>
              <p className="text-sm text-[var(--cf-muted)]">Role: {roleLabel}</p>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.checked)}
                />
                Email notifications
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={notifyPayroll}
                  onChange={(e) => setNotifyPayroll(e.target.checked)}
                />
                Payroll reminders
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={notifyOverdue}
                  onChange={(e) => setNotifyOverdue(e.target.checked)}
                />
                Overdue invoice alerts
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" type="button" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setSavedMsg(`Saved locally as ${draftName}.`);
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </Panel>
  );
}
