import { MarketingShell } from "@/components/marketing/marketing-shell";
import { INDUSTRIES } from "@/lib/marketing/content";

export const metadata = {
  title: "Industries We Serve · TalentQuest",
  description:
    "Staffing coverage across healthcare, IT, finance, manufacturing, and more.",
};

export default function IndustriesPage() {
  return (
    <MarketingShell>
      <section className="bg-[var(--ot-navy)] px-4 py-14 text-white sm:px-6">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold tracking-[0.16em] text-[var(--ot-ocean)] uppercase">
            Industries We Serve
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold">
            Specialized recruiting for the roles that keep businesses moving.
          </h1>
          <p className="mt-4 max-w-2xl text-white/75">
            TalentQuest places temporary, contract, and permanent talent across
            the industries staffing agencies serve most.
          </p>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:px-6">
        {INDUSTRIES.map((industry) => (
          <article
            key={industry.slug}
            id={industry.slug}
            className="scroll-mt-28 rounded-xl border border-[var(--ot-border)] bg-white p-6"
          >
            <h2 className="text-xl font-semibold text-[var(--ot-navy)]">
              {industry.name}
            </h2>
            <p className="mt-2 max-w-3xl leading-relaxed text-[var(--ot-muted)]">
              {industry.summary}
            </p>
          </article>
        ))}
      </section>
    </MarketingShell>
  );
}
