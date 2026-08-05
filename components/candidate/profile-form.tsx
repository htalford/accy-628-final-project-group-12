"use client";

import { useState, useTransition } from "react";
import { updateCandidateProfile } from "@/app/actions/candidate";
import type { AppUser, Employee } from "@/lib/types/database";

export function ProfileForm({
  user,
  employee,
}: {
  user: AppUser;
  employee: Employee;
}) {
  const [firstName, setFirstName] = useState(employee.first_name);
  const [lastName, setLastName] = useState(employee.last_name);
  const [phone, setPhone] = useState(employee.phone ?? "");
  const [displayName, setDisplayName] = useState(user.name);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="grid max-w-xl gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        startTransition(async () => {
          const result = await updateCandidateProfile({
            firstName,
            lastName,
            phone,
            displayName,
          });
          setMessage(result.ok ? "Profile saved." : result.error);
        });
      }}
    >
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Display name</span>
        <input
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="rounded-md border border-[var(--cf-border)] px-3 py-2"
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">First name</span>
          <input
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="rounded-md border border-[var(--cf-border)] px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Last name</span>
          <input
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="rounded-md border border-[var(--cf-border)] px-3 py-2"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Email</span>
        <input
          value={employee.email}
          disabled
          className="rounded-md border border-[var(--cf-border)] bg-[var(--cf-surface)] px-3 py-2 text-[var(--cf-muted)]"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Phone</span>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="rounded-md border border-[var(--cf-border)] px-3 py-2"
        />
      </label>
      <p className="text-xs text-[var(--cf-muted)]">
        Employment type: {employee.employment_type} · Status: {employee.status}
      </p>
      {message ? (
        <p className="text-sm text-[var(--cf-muted)]">{message}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-md bg-[var(--cf-navy)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--cf-navy-hover)] disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
