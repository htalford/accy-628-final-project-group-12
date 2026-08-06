import Link from "next/link";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { JobSearchBar } from "@/components/marketing/job-search-bar";

export const metadata = {
  title: "Job search · TalentQuest",
  description: "Search open job titles. Sign up to see full details.",
};

export default function JobsPage() {
  return (
    <MarketingShell>
      <section className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--ot-navy)]">
          Job search
        </h1>
        <p className="mt-3 text-[var(--ot-muted)]">
          Search by title or location. Tap a title to get started.
        </p>

        <div className="mt-8">
          <JobSearchBar />
        </div>

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
