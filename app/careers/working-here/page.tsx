import Link from "next/link";
import { MarketingShell } from "@/components/marketing/marketing-shell";

export const metadata = {
  title: "Working at TalentQuest · TalentQuest",
};

export default function WorkingHerePage() {
  return (
    <MarketingShell>
      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <p className="text-sm font-semibold tracking-[0.16em] text-[var(--ot-ocean)] uppercase">
          Careers at TQ
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-[var(--ot-navy)]">
          Working at TalentQuest
        </h1>
        <div className="mt-8 space-y-6 text-[var(--ot-muted)] leading-relaxed">
          <p>
            Talent Quest is a staffing firm built on clear communication,
            reliable follow-through, and respect for every candidate and client.
            Internal team members own relationships, not just requisitions.
          </p>
          <p>
            Recruiters specialize by industry — healthcare, IT, finance,
            manufacturing, and more — so you can become an expert instead of
            chasing every open req. Coordinators and operations teammates keep
            timesheets, onboarding, and client communication running smoothly.
          </p>
          <p>
            You’ll work with modern tools, a collaborative desk, and managers
            who care about quality of hire. Growth paths include senior
            recruiting, account management, and leadership.
          </p>
        </div>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/careers/apply"
            className="rounded-md bg-[var(--ot-ocean)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--ot-ocean-hover)]"
          >
            How to apply
          </Link>
          <Link
            href="/careers/login"
            className="text-sm font-semibold text-[var(--ot-navy)] hover:text-[var(--ot-ocean)]"
          >
            Current employee login
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
