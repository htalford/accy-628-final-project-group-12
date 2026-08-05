"use client";

import { useState, useTransition } from "react";
import { updateCandidateProfile } from "@/app/actions/candidate";
import type { AppUser, Employee } from "@/lib/types/database";

function Field({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium tracking-wide text-[var(--cf-muted)] uppercase">
        {label}
      </p>
      <p className="mt-1 text-sm text-[var(--cf-ink)] whitespace-pre-wrap">
        {value.trim() ? value : "—"}
      </p>
    </div>
  );
}

export function ProfileForm({
  user,
  employee,
}: {
  user: AppUser;
  employee: Employee;
}) {
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(employee.first_name);
  const [lastName, setLastName] = useState(employee.last_name);
  const [phone, setPhone] = useState(employee.phone ?? "");
  const [displayName, setDisplayName] = useState(user.name);
  const [certifications, setCertifications] = useState(
    employee.certifications ?? "",
  );
  const [resumeUrl, setResumeUrl] = useState(employee.resume_url ?? "");
  const [emergencyContactName, setEmergencyContactName] = useState(
    employee.emergency_contact_name ?? "",
  );
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(
    employee.emergency_contact_phone ?? "",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function resetFromProps() {
    setFirstName(employee.first_name);
    setLastName(employee.last_name);
    setPhone(employee.phone ?? "");
    setDisplayName(user.name);
    setCertifications(employee.certifications ?? "");
    setResumeUrl(employee.resume_url ?? "");
    setEmergencyContactName(employee.emergency_contact_name ?? "");
    setEmergencyContactPhone(employee.emergency_contact_phone ?? "");
  }

  if (!editing) {
    return (
      <div className="space-y-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Display name" value={displayName} />
          <Field label="Email" value={employee.email} />
          <Field label="First name" value={firstName} />
          <Field label="Last name" value={lastName} />
          <Field label="Phone" value={phone} />
          <Field
            label="Employment"
            value={`${employee.employment_type} · ${employee.status}`}
          />
          <div className="sm:col-span-2">
            <Field label="Certifications" value={certifications} />
          </div>
          <div className="sm:col-span-2">
            <Field label="Resume link" value={resumeUrl} />
          </div>
          <Field label="Emergency contact name" value={emergencyContactName} />
          <Field
            label="Emergency contact phone"
            value={emergencyContactPhone}
          />
        </div>

        <div className="border-t border-[var(--cf-border)] pt-4">
          <button
            type="button"
            onClick={() => {
              setMessage(null);
              setEditing(true);
            }}
            className="rounded-md bg-[var(--cf-navy)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--cf-navy-hover)]"
          >
            Edit profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        startTransition(async () => {
          const result = await updateCandidateProfile({
            firstName,
            lastName,
            phone,
            displayName,
            certifications,
            resumeUrl,
            emergencyContactName,
            emergencyContactPhone,
          });
          if (result.ok) {
            setMessage("Profile saved.");
            setEditing(false);
          } else {
            setMessage(result.error);
          }
        });
      }}
    >
      <div className="grid max-w-xl gap-4">
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

        <div className="border-t border-[var(--cf-border)] pt-4">
          <p className="mb-3 text-sm font-semibold text-[var(--cf-ink)]">
            Profile completion
          </p>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Certifications</span>
            <textarea
              value={certifications}
              onChange={(e) => setCertifications(e.target.value)}
              rows={3}
              placeholder="CPA candidate, QuickBooks, SHRM-CP…"
              className="rounded-md border border-[var(--cf-border)] px-3 py-2"
            />
          </label>
          <label className="mt-4 flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Resume link</span>
            <input
              type="url"
              value={resumeUrl}
              onChange={(e) => setResumeUrl(e.target.value)}
              placeholder="https://…"
              className="rounded-md border border-[var(--cf-border)] px-3 py-2"
            />
          </label>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">Emergency contact name</span>
              <input
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
                className="rounded-md border border-[var(--cf-border)] px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">Emergency contact phone</span>
              <input
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                className="rounded-md border border-[var(--cf-border)] px-3 py-2"
              />
            </label>
          </div>
        </div>

        <p className="text-xs text-[var(--cf-muted)]">
          Employment type: {employee.employment_type} · Status:{" "}
          {employee.status}
        </p>
      </div>

      <div className="border-t border-[var(--cf-border)] pt-4">
        {message ? (
          <p className="mb-3 text-sm text-[var(--cf-muted)]">{message}</p>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-[var(--cf-navy)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--cf-navy-hover)] disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save profile"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              resetFromProps();
              setMessage(null);
              setEditing(false);
            }}
            className="rounded-md border border-[var(--cf-border)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--cf-ink)] hover:bg-[var(--cf-surface)] disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
