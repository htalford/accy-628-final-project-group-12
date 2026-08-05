import Link from "next/link";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { JobSearchBar } from "@/components/marketing/job-search-bar";

type JobsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata = {
  title: "Job search · TalentQuest",
  description: "Search openings by title, location, and distance.",
};

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const location = typeof params.location === "string" ? params.location : "";
  const distance =
    typeof params.distance === "string" ? params.distance : "";
  const remote = params.remote === "1";

  const hasQuery = Boolean(q || location || remote);

  return (
    <MarketingShell>
      <section className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--ot-navy)]">
          Job search
        </h1>
        <p className="mt-3 text-[var(--ot-muted)]">
          Results will connect to live placements as the team wires job data.
        </p>

        <div className="mt-8">
          <JobSearchBar />
        </div>

        {hasQuery ? (
          <div className="mt-10 rounded-xl border border-[var(--ot-border)] bg-white px-5 py-6 text-sm text-[var(--ot-muted)]">
            <p className="font-medium text-[var(--ot-navy)]">Current search</p>
            <ul className="mt-3 list-inside list-disc space-y-1">
              {q ? <li>Keyword: {q}</li> : null}
              {location ? <li>Location: {location}</li> : null}
              {distance ? <li>Distance: {distance}</li> : null}
              {remote ? <li>Remote jobs only</li> : null}
            </ul>
            <p className="mt-4">No live listings yet — placeholder for your team.</p>
          </div>
        ) : null}

        <Link
          href="/"
          className="mt-8 inline-block text-sm font-semibold text-[var(--ot-ocean)] hover:underline"
        >
          ← Back to home
        </Link>
      </section>
    </MarketingShell>
  );
}
