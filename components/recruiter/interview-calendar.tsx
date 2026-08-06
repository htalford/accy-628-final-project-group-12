"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { RecruiterInterview } from "@/lib/recruiter/types";
import { rescheduleInterview } from "@/app/actions/recruiter";
import { StatusBadge } from "@/components/ui/status-badge";

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

export function InterviewCalendar({
  interviews,
}: {
  interviews: RecruiterInterview[];
}) {
  const router = useRouter();
  const [cursor, setCursor] = useState(() => {
    const now = Date.now();
    const upcoming = [...interviews]
      .filter((i) => !Number.isNaN(new Date(i.datetime).getTime()))
      .sort((a, b) => a.datetime.localeCompare(b.datetime))
      .find((i) => new Date(i.datetime).getTime() >= now - 3600_000);
    const anchor = upcoming ?? interviews[0];
    return startOfDay(anchor ? new Date(anchor.datetime) : new Date());
  });
  const [selected, setSelected] = useState<RecruiterInterview | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const today = startOfDay(new Date());

  const label = cursor.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

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
      {notice ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {notice}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 rounded-xl border border-[var(--cf-border)] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => shift(-1)}
            className="rounded-lg border border-[var(--cf-border)] px-3 py-1.5 text-sm"
          >
            Prev
          </button>
          <p className="min-w-[12rem] text-center text-sm font-semibold text-[var(--cf-ink)]">
            {label}
          </p>
          <button
            type="button"
            onClick={() => shift(1)}
            className="rounded-lg border border-[var(--cf-border)] px-3 py-1.5 text-sm"
          >
            Next
          </button>
        </div>
        <p className="text-xs font-medium tracking-wide text-[var(--cf-muted)] uppercase">
          Month
        </p>
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
                      {item.time} · {item.candidate}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <section className="rounded-xl border border-[var(--cf-border)] bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold">Interview list</h2>
        {interviews.length === 0 ? (
          <p className="text-sm text-[var(--cf-muted)]">
            No scheduled interviews yet. Schedule from a candidate detail page.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--cf-border)]">
            {interviews.map((item) => (
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
                    {item.candidate}
                  </button>
                  <p className="text-xs text-[var(--cf-muted)]">
                    {item.position} · {item.date} {item.time} · {item.type}
                  </p>
                </div>
                <StatusBadge status={item.status} />
              </li>
            ))}
          </ul>
        )}
      </section>

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
                <dt className="text-xs text-[var(--cf-muted)] uppercase">Candidate</dt>
                <dd>
                  <Link
                    href={`/recruiter/candidates/${selected.applicationId}`}
                    className="text-[var(--cf-navy)] hover:underline"
                  >
                    {selected.candidate}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--cf-muted)] uppercase">Position</dt>
                <dd>{selected.position}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--cf-muted)] uppercase">When</dt>
                <dd>
                  {selected.date} · {selected.time} ({selected.type})
                </dd>
              </div>
              {selected.notes ? (
                <div>
                  <dt className="text-xs text-[var(--cf-muted)] uppercase">Notes</dt>
                  <dd>{selected.notes}</dd>
                </div>
              ) : null}
            </dl>
            <label className="mt-4 block text-xs font-medium text-[var(--cf-muted)]">
              Reschedule to
              <input
                id="reschedule-dt"
                type="datetime-local"
                className="mt-1 w-full rounded-lg border border-[var(--cf-border)] px-3 py-2 text-sm"
                defaultValue={selected.datetime.slice(0, 16)}
              />
            </label>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setSelected(null)}>
                Cancel
              </button>
              <button
                type="button"
                disabled={pending}
                className="rounded-lg bg-[var(--cf-navy)] px-3 py-2 text-sm text-white disabled:opacity-50"
                onClick={() => {
                  const el = document.getElementById(
                    "reschedule-dt",
                  ) as HTMLInputElement;
                  if (!el.value) return;
                  const interview = selected;
                  setSelected(null);
                  startTransition(async () => {
                    const result = await rescheduleInterview({
                      applicationId: interview.applicationId,
                      datetime: new Date(el.value).toISOString(),
                      interviewType: interview.type,
                    });
                    setNotice(
                      result.ok
                        ? result.message ?? "Rescheduled"
                        : result.error ?? "Failed",
                    );
                    if (result.ok) router.refresh();
                  });
                }}
              >
                Reschedule
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
