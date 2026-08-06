"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CandidateInterview } from "@/lib/candidate/data";
import { StatusPill } from "@/components/candidate/ui";

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
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const label = useMemo(
    () =>
      cursor.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      }),
    [cursor],
  );

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

  const listInterviews = useMemo(() => {
    if (!selectedDay) return interviews;
    return interviewsOn(selectedDay);
  }, [interviews, selectedDay]);

  const upcoming = useMemo(() => {
    const now = Date.now();
    return interviews.filter(
      (i) => new Date(i.datetime).getTime() >= now - 3600_000,
    );
  }, [interviews]);

  return (
    <div className="space-y-4">
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
          <button
            type="button"
            onClick={() => {
              setCursor(startOfDay(new Date()));
              setSelectedDay(null);
            }}
            className="rounded-lg border border-[var(--cf-border)] px-3 py-1.5 text-xs font-medium text-[var(--cf-muted)] hover:text-[var(--cf-ink)]"
          >
            Today
          </button>
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
          const isSelected = selectedDay ? sameDay(selectedDay, day) : false;
          const isToday = sameDay(day, new Date());
          return (
            <button
              type="button"
              key={day.toISOString()}
              onClick={() => setSelectedDay(day)}
              className={`relative min-h-[7rem] rounded-xl border p-2 text-left shadow-sm transition ${
                isToday
                  ? "border-[var(--cf-accent)] bg-[var(--cf-accent)]/10 ring-2 ring-[var(--cf-accent)]/45"
                  : isSelected
                    ? "border-[var(--cf-accent)] bg-[var(--cf-accent)]/5"
                    : "border-[var(--cf-border)] bg-white hover:border-[var(--cf-accent)]/40"
              } ${inMonth ? "" : "opacity-40"}`}
            >
              <div className="flex items-center justify-between gap-1">
                <p
                  className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full text-xs font-semibold ${
                    isToday
                      ? "bg-[var(--cf-accent)] px-1.5 text-white"
                      : "text-[var(--cf-muted)]"
                  }`}
                >
                  {day.getDate()}
                </p>
                {isToday ? (
                  <span className="text-[10px] font-bold tracking-wide text-[var(--cf-accent)] uppercase">
                    Today
                  </span>
                ) : null}
              </div>
              <ul className="mt-1 space-y-1">
                {items.map((item) => (
                  <li key={item.id}>
                    <span className="block w-full truncate rounded-md bg-[var(--cf-accent)]/10 px-2 py-1 text-[11px] font-medium text-[var(--cf-navy)]">
                      {item.time} · {item.employer}
                    </span>
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      <section className="rounded-xl border border-[var(--cf-border)] bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-[var(--cf-ink)]">
            {selectedDay
              ? `Interviews on ${selectedDay.toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}`
              : "Scheduled interviews"}
          </h2>
          {selectedDay ? (
            <button
              type="button"
              onClick={() => setSelectedDay(null)}
              className="text-xs font-semibold text-[var(--cf-accent)] hover:underline"
            >
              Show all
            </button>
          ) : (
            <p className="text-xs text-[var(--cf-muted)]">
              {upcoming.length} upcoming
            </p>
          )}
        </div>

        {listInterviews.length === 0 ? (
          <p className="text-sm text-[var(--cf-muted)]">
            {selectedDay
              ? "No interviews on this day."
              : "No interviews scheduled yet. When a recruiter books one on your application, it will show here."}
          </p>
        ) : (
          <ul className="divide-y divide-[var(--cf-border)]">
            {listInterviews.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium text-[var(--cf-ink)]">
                    {item.role}
                    <span className="font-normal text-[var(--cf-muted)]">
                      {" "}
                      · {item.employer}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--cf-muted)]">
                    {item.date} · {item.time} · {item.type}
                    {item.location ? ` · ${item.location}` : ""}
                  </p>
                  {item.notes ? (
                    <p className="mt-1 text-xs text-[var(--cf-muted)]">
                      {item.notes}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusPill
                    label={item.status}
                    tone={
                      item.status === "interview" || item.status === "offered"
                        ? "good"
                        : item.status === "rejected"
                          ? "bad"
                          : "warn"
                    }
                  />
                  <Link
                    href="/candidate/applications"
                    className="rounded-lg border border-[var(--cf-border)] px-2.5 py-1.5 text-xs font-semibold text-[var(--cf-ink)] transition hover:bg-[var(--cf-surface)]"
                  >
                    Application
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
