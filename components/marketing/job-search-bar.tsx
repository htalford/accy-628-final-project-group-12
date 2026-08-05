"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Crosshair, MapPin, Search } from "lucide-react";

const DISTANCES = ["5 miles", "10 miles", "25 miles", "50 miles", "Any distance"];

export function JobSearchBar() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [distance, setDistance] = useState("25 miles");
  const [remoteOnly, setRemoteOnly] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (title.trim()) params.set("q", title.trim());
    if (location.trim()) params.set("location", location.trim());
    if (distance) params.set("distance", distance);
    if (remoteOnly) params.set("remote", "1");
    router.push(`/jobs?${params.toString()}`);
  }

  return (
    <div className="relative z-20 rounded-2xl bg-[var(--ot-navy)] px-6 py-10 shadow-2xl md:px-10 md:py-12">
      <h2 className="text-center text-lg font-semibold tracking-[0.18em] text-white uppercase sm:text-xl">
        Find your perfect job
      </h2>

      <form onSubmit={onSubmit} className="mt-8">
        <div className="flex flex-col rounded-2xl border border-white/20 bg-white shadow-sm md:flex-row md:items-stretch md:overflow-hidden md:rounded-full">
          <label className="flex min-w-0 flex-1 items-center gap-3 border-b border-[var(--ot-border)] px-5 py-4 md:border-b-0 md:border-r">
            <Search className="h-5 w-5 shrink-0 text-[var(--ot-muted)]" aria-hidden />
            <span className="sr-only">Title or keyword</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title or keyword"
              className="w-full min-w-0 bg-transparent text-base text-[var(--ot-ink)] outline-none placeholder:text-[var(--ot-muted)] sm:text-lg"
            />
          </label>

          <label className="flex min-w-0 flex-1 items-center gap-3 border-b border-[var(--ot-border)] px-5 py-4 md:border-b-0 md:border-r">
            <MapPin className="h-5 w-5 shrink-0 text-[var(--ot-muted)]" aria-hidden />
            <span className="sr-only">City or ZIP</span>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City or ZIP / postal code"
              className="w-full min-w-0 bg-transparent text-base text-[var(--ot-ink)] outline-none placeholder:text-[var(--ot-muted)] sm:text-lg"
            />
          </label>

          <label className="flex min-w-0 items-center gap-3 border-b border-[var(--ot-border)] px-5 py-4 md:w-52 md:border-b-0 md:border-r">
            <Crosshair className="h-5 w-5 shrink-0 text-[var(--ot-muted)]" aria-hidden />
            <span className="sr-only">Distance</span>
            <select
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              className="w-full appearance-none bg-transparent text-base text-[var(--ot-ink)] outline-none sm:text-lg"
            >
              {DISTANCES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            className="bg-[var(--ot-navy)] px-8 py-4 text-base font-bold tracking-[0.12em] text-[var(--ot-ocean)] transition hover:bg-[var(--ot-navy-hover)] md:rounded-r-full sm:text-lg"
          >
            SEARCH
          </button>
        </div>

        <label className="mt-5 flex items-center justify-center gap-3 text-base text-white/90 md:justify-start md:pl-2">
          <input
            type="checkbox"
            checked={remoteOnly}
            onChange={(e) => setRemoteOnly(e.target.checked)}
            className="h-5 w-5 rounded border-white/40 bg-transparent accent-[var(--ot-ocean)]"
          />
          Remote jobs
        </label>
      </form>
    </div>
  );
}
