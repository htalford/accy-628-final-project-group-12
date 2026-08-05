"use client";

import { useState, useTransition } from "react";
import { submitTimesheet } from "@/app/actions/candidate";
import type { PlacementWithClient } from "@/lib/candidate/data";

export function TimesheetForm({
  placements,
}: {
  placements: PlacementWithClient[];
}) {
  const active = placements.filter((p) => p.status === "active");
  const [placementId, setPlacementId] = useState(active[0]?.id ?? "");
  const [weekEndingDate, setWeekEndingDate] = useState("");
  const [hoursRegular, setHoursRegular] = useState("40");
  const [hoursOvertime, setHoursOvertime] = useState("0");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (active.length === 0) {
    return (
      <p className="text-sm text-[var(--cf-muted)]">
        You need an active placement before submitting timesheets.
      </p>
    );
  }

  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        startTransition(async () => {
          const result = await submitTimesheet({
            placementId,
            weekEndingDate,
            hoursRegular: Number(hoursRegular),
            hoursOvertime: Number(hoursOvertime),
          });
          setMessage(result.ok ? "Timesheet submitted." : result.error);
        });
      }}
    >
      <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
        <span className="font-medium">Placement</span>
        <select
          required
          value={placementId}
          onChange={(e) => setPlacementId(e.target.value)}
          className="rounded-md border border-[var(--cf-border)] bg-white px-3 py-2"
        >
          {active.map((p) => (
            <option key={p.id} value={p.id}>
              {p.clients?.name ?? "Employer"} · {p.placement_type} ·{" "}
              {p.pay_rate != null ? `$${p.pay_rate}/hr` : "rate TBD"}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Week ending</span>
        <input
          type="date"
          required
          value={weekEndingDate}
          onChange={(e) => setWeekEndingDate(e.target.value)}
          className="rounded-md border border-[var(--cf-border)] bg-white px-3 py-2"
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Regular hours</span>
          <input
            type="number"
            min="0"
            step="0.25"
            required
            value={hoursRegular}
            onChange={(e) => setHoursRegular(e.target.value)}
            className="rounded-md border border-[var(--cf-border)] bg-white px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Overtime hours</span>
          <input
            type="number"
            min="0"
            step="0.25"
            required
            value={hoursOvertime}
            onChange={(e) => setHoursOvertime(e.target.value)}
            className="rounded-md border border-[var(--cf-border)] bg-white px-3 py-2"
          />
        </label>
      </div>
      {message ? (
        <p className="text-sm text-[var(--cf-muted)] sm:col-span-2">{message}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-[var(--cf-navy)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--cf-navy-hover)] disabled:opacity-60 sm:col-span-2 sm:w-fit"
      >
        {pending ? "Submitting…" : "Submit timesheet"}
      </button>
    </form>
  );
}
