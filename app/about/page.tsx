import { Suspense } from "react";
import { AboutTabs } from "@/components/marketing/about-tabs";
import { MarketingShell } from "@/components/marketing/marketing-shell";

export const metadata = {
  title: "About Us · TalentQuest",
  description:
    "Mission, values, and approach behind TalentQuest staffing.",
};

export default function AboutPage() {
  return (
    <MarketingShell>
      <section className="bg-[var(--ot-mist)] px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold tracking-[0.16em] text-[var(--ot-ocean)] uppercase">
            About Us
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-[var(--ot-navy)]">
            Built on Talent Quest.
          </h1>
          <p className="mt-4 max-w-2xl text-[var(--ot-muted)]">
            We help clients find people they can rely on, and help candidates
            find work where they can grow. Explore who we are and why we staff
            the way we do.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <Suspense fallback={<p className="text-[var(--ot-muted)]">Loading…</p>}>
          <AboutTabs />
        </Suspense>
      </section>
    </MarketingShell>
  );
}
