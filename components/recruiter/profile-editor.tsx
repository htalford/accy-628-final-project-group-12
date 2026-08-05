"use client";

import { useState } from "react";
import type { RecruiterProfile } from "@/lib/recruiter/types";
import { StatCard } from "@/components/ui/stat-card";

const STORAGE_KEY = "tq-recruiter-profile-overrides";

type Overrides = Partial<
  Pick<
    RecruiterProfile,
    | "name"
    | "email"
    | "phone"
    | "office"
    | "department"
    | "jobTitle"
    | "biography"
    | "hireDate"
  >
>;

function loadOverrides(): Overrides {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Overrides;
  } catch {
    return {};
  }
}

export function RecruiterProfileView({ profile }: { profile: RecruiterProfile }) {
  const [overrides, setOverrides] = useState<Overrides>(() => loadOverrides());
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Overrides>({});
  const [notice, setNotice] = useState<string | null>(null);

  const data = { ...profile, ...overrides };

  return (
    <div className="space-y-6">
      {notice ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {notice}
        </div>
      ) : null}

      <section className="flex flex-col gap-4 rounded-xl border border-[var(--cf-border)] bg-white p-5 shadow-sm lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-4">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--cf-navy)]/10 text-2xl font-semibold text-[var(--cf-navy)]">
            {data.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[var(--cf-ink)]">
              {data.name}
            </h2>
            <p className="text-sm text-[var(--cf-muted)]">{data.jobTitle}</p>
            <p className="mt-2 text-sm text-[var(--cf-muted)]">
              {data.email} · {data.phone}
            </p>
            <p className="text-sm text-[var(--cf-muted)]">
              {data.department} · {data.office}
            </p>
            <p className="mt-1 text-xs text-[var(--cf-muted)]">
              Recruiter ID {data.recruiterId} · Hired {data.hireDate}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setDraft({
              name: data.name,
              email: data.email,
              phone: data.phone,
              office: data.office,
              department: data.department,
              jobTitle: data.jobTitle,
              biography: data.biography,
              hireDate: data.hireDate,
            });
            setEditing(true);
          }}
          className="rounded-lg bg-[var(--cf-navy)] px-3 py-2 text-sm font-medium text-white"
        >
          Edit Profile
        </button>
      </section>

      <section className="rounded-xl border border-[var(--cf-border)] bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold">Biography</h3>
        <p className="mt-2 text-sm text-[var(--cf-ink)] whitespace-pre-wrap">
          {data.biography}
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Placements This Year"
          value={String(data.metrics.placementsThisYear)}
        />
        <StatCard
          label="Open Job Orders"
          value={String(data.metrics.openJobOrders)}
        />
        <StatCard
          label="Active Candidates"
          value={String(data.metrics.activeCandidates)}
        />
        <StatCard
          label="Avg Time to Fill"
          value={`${data.metrics.averageTimeToFill} days`}
        />
        <StatCard
          label="Interview-to-Hire"
          value={`${Math.round(data.metrics.interviewToHireRate * 100)}%`}
        />
      </div>

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-[var(--cf-border)] bg-white p-5 shadow-lg">
            <h3 className="mb-4 text-sm font-semibold">Edit profile</h3>
            {(
              [
                ["name", "Full name"],
                ["email", "Email"],
                ["phone", "Phone"],
                ["office", "Office location"],
                ["department", "Department"],
                ["jobTitle", "Job title"],
                ["hireDate", "Hire date"],
              ] as const
            ).map(([key, label]) => (
              <label
                key={key}
                className="mb-3 block text-xs font-medium text-[var(--cf-muted)]"
              >
                {label}
                <input
                  value={String(draft[key] ?? "")}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-[var(--cf-border)] px-3 py-2 text-sm"
                />
              </label>
            ))}
            <label className="mb-3 block text-xs font-medium text-[var(--cf-muted)]">
              Biography
              <textarea
                value={draft.biography ?? ""}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, biography: e.target.value }))
                }
                rows={4}
                className="mt-1 w-full rounded-lg border border-[var(--cf-border)] px-3 py-2 text-sm"
              />
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="rounded-lg bg-[var(--cf-navy)] px-3 py-2 text-sm text-white"
                onClick={() => {
                  localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
                  setOverrides(draft);
                  setEditing(false);
                  setNotice("Profile updated.");
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
