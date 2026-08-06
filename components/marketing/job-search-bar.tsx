"use client";

import { useEffect, useState, useTransition } from "react";
import { MapPin, Search } from "lucide-react";
import { searchPublicJobTitles } from "@/app/actions/public-jobs";

const GET_STARTED_HREF = "/signup?interest=work";

type JobTitleHit = {
  id: string;
  title: string;
};

export function JobSearchBar() {
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [hits, setHits] = useState<JobTitleHit[]>([]);
  const [searched, setSearched] = useState(false);
  const [pending, startTransition] = useTransition();

  function runSearch(nextTitle = title, nextLocation = location) {
    const q = nextTitle.trim();
    const loc = nextLocation.trim();
    if (!q && !loc) {
      setHits([]);
      setSearched(false);
      return;
    }

    startTransition(async () => {
      const rows = await searchPublicJobTitles({
        q,
        location: loc,
      });
      setHits(rows.map((row) => ({ id: row.id, title: row.title })));
      setSearched(true);
    });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    runSearch();
  }

  useEffect(() => {
    const q = title.trim();
    const loc = location.trim();
    if (!q && !loc) {
      setHits([]);
      setSearched(false);
      return;
    }

    const handle = setTimeout(() => {
      runSearch(q, loc);
    }, 280);
    return () => clearTimeout(handle);
    // Intentionally only re-run when the typed fields change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, location]);

  return (
    <div className="relative z-20 rounded-2xl bg-[var(--ot-navy)] px-6 py-10 shadow-2xl md:px-10 md:py-12">
      <h2 className="text-center text-lg font-semibold tracking-[0.18em] text-white uppercase sm:text-xl">
        Find your perfect job
      </h2>

      <form onSubmit={onSubmit} className="mt-8">
        <div className="flex flex-col rounded-2xl border border-white/20 bg-white shadow-sm md:flex-row md:items-stretch md:overflow-hidden md:rounded-full">
          <label className="flex min-w-0 flex-1 items-center gap-3 border-b border-[var(--ot-border)] px-5 py-4 md:border-b-0 md:border-r">
            <Search
              className="h-5 w-5 shrink-0 text-[var(--ot-muted)]"
              aria-hidden
            />
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
            <MapPin
              className="h-5 w-5 shrink-0 text-[var(--ot-muted)]"
              aria-hidden
            />
            <span className="sr-only">City or location</span>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City or location"
              className="w-full min-w-0 bg-transparent text-base text-[var(--ot-ink)] outline-none placeholder:text-[var(--ot-muted)] sm:text-lg"
            />
          </label>

          <button
            type="submit"
            className="bg-[var(--ot-navy)] px-8 py-4 text-base font-bold tracking-[0.12em] text-[var(--ot-ocean)] transition hover:bg-[var(--ot-navy-hover)] md:rounded-r-full sm:text-lg"
          >
            {pending ? "…" : "SEARCH"}
          </button>
        </div>
      </form>

      {searched ? (
        <div className="mt-5 overflow-hidden rounded-xl border border-white/20 bg-white">
          {hits.length === 0 ? (
            <p className="px-4 py-3 text-sm text-[var(--ot-muted)]">
              No matching job titles.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--ot-border)]">
              {hits.map((job) => (
                <li key={job.id}>
                  <a
                    href={GET_STARTED_HREF}
                    className="block px-4 py-3 text-base font-medium text-[var(--ot-navy)] transition hover:bg-[var(--ot-mist)]/60"
                  >
                    {job.title}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
