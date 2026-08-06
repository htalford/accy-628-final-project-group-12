"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CandidateInterview } from "@/lib/candidate/data";
import { StatusBadge, statusTone } from "@/components/ui/status-badge";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function CandidateInterviewCalendar({
  interviews,
}: {
  interviews: CandidateInterview[];
}) {
  const [cursor, setCursor] = useState(() => {
    const now = Date.now();
    const upcoming = [...interviews]
      .filter((i) => !Number.isNaN(new Date(i.datetime).getTime()))
      .sort((a, b) => a.datetime.localeCompare(b.datetime))
      .find((i) => new Date(i.datetime).getTime() >= now - 3600_000);
    const anchor = upcoming ?? interviews[0];
    return startOfDay(anchor ? new Date(anchor.datetime) : new Date());
  });
  const [selected, setSelected] = useState<CandidateInterview | null>(null);
  const today = startOfDay(new Date());

  const label = cursor.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const listPreview = useMemo(() => {
    const now = Date.now() - 3600_000;
    const chronological = [...interviews].sort((a, b) =>
      a.datetime.localeCompare(b.datetime),
    );
    const upcoming = chronological.filter(
      (i) => new Date(i.datetime).getTime() >= now,
    );
    return (upcoming.length > 0 ? upcoming : chronological).slice(0, 3);
  }, [interviews]);

  const days = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = addDays(first, -((first.getDay() + 6) % 7)); // Monday-based
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }, [cursor]);

  function interviewsOn(day: Date) {
    return interviews.filter((i) => sameDay(new Date(i.datetime), day));
  }

  function shift(dir: -1 | 1) {
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + dir, 1));
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-[var(--cf-border)] bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold">Interview list</h2>
        {listPreview.length === 0 ? (
          <p className="text-sm text-[var(--cf-muted)]">
            No scheduled interviews yet. When a recruiter books one on your
            application, it will show here.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--cf-border)]">
            {listPreview.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <button
                    type="button"
                    onClick={() => setSelected(item)}
                    className="font-medium text-[var(--cf-navy)] hover:underline"
                  >
                    {item.role}
                  </button>
                  <p className="text-xs text-[var(--cf-muted)]">
                    {item.employer} · {item.date} {item.time} · {item.type}
                  </p>
                </div>
                <StatusBadge
                  label={item.status}
                  tone={statusTone(item.status)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex flex-col gap-3 rounded-xl border border-[var(--cf-border)] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => shift(-1)}
            aria-label="Previous month"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--cf-border)] text-[var(--cf-ink)] hover:bg-[var(--cf-surface)]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => shift(1)}
            aria-label="Next month"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--cf-border)] text-[var(--cf-ink)] hover:bg-[var(--cf-surface)]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <p className="ml-2 text-sm font-semibold text-[var(--cf-ink)]">
            {label}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div
            key={d}
            className="px-2 text-xs font-semibold tracking-wide text-[var(--cf-muted)] uppercase"
          >
            {d}
          </div>
        ))}
        {days.map((day) => {
          const items = interviewsOn(day);
          const inMonth = day.getMonth() === cursor.getMonth();
          const isToday = sameDay(day, today);
          return (
            <div
              key={day.toISOString()}
              className={`min-h-[7rem] rounded-xl border bg-white p-2 shadow-sm ${
                isToday
                  ? "border-[var(--cf-navy)] ring-2 ring-[var(--cf-navy)]/25"
                  : "border-[var(--cf-border)]"
              } ${inMonth ? "" : "opacity-40"}`}
            >
              <p
                className={`text-xs font-semibold ${
                  isToday
                    ? "inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--cf-navy)] text-white"
                    : "text-[var(--cf-muted)]"
                }`}
              >
                {day.getDate()}
              </p>
              <ul className="mt-1 space-y-1">
                {items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(item)}
                      className="w-full rounded-md bg-[var(--cf-accent)]/10 px-2 py-1 text-left text-[11px] font-medium text-[var(--cf-navy)] hover:bg-[var(--cf-accent)]/20"
                    >
                      {item.time} · {item.employer}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-[var(--cf-border)] bg-white p-5 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Interview details</h3>
              <button type="button" onClick={() => setSelected(null)}>
                Close
              </button>
            </div>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-xs text-[var(--cf-muted)] uppercase">
                  Position
                </dt>
                <dd>{selected.role}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--cf-muted)] uppercase">
                  Employer
                </dt>
                <dd>{selected.employer}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--cf-muted)] uppercase">When</dt>
                <dd>
                  {selected.date} · {selected.time} ({selected.type})
                </dd>
              </div>
              {selected.location ? (
                <div>
                  <dt className="text-xs text-[var(--cf-muted)] uppercase">
                    Location
                  </dt>
                  <dd>{selected.location}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-xs text-[var(--cf-muted)] uppercase">
                  Status
                </dt>
                <dd className="mt-1">
                  <StatusBadge
                    label={selected.status}
                    tone={statusTone(selected.status)}
                  />
                </dd>
              </div>
              {selected.notes ? (
                <div>
                  <dt className="text-xs text-[var(--cf-muted)] uppercase">
                    Notes
                  </dt>
                  <dd>{selected.notes}</dd>
                </div>
              ) : null}
            </dl>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <Link
                href="/candidate/applications"
                className="rounded-lg border border-[var(--cf-border)] px-3 py-2 text-sm font-semibold text-[var(--cf-ink)] hover:bg-[var(--cf-surface)]"
              >
                View application
              </Link>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg bg-[var(--cf-navy)] px-3 py-2 text-sm text-white"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
