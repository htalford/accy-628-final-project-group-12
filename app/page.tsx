import Image from "next/image";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { INDUSTRIES } from "@/lib/marketing/content";

export default function HomePage() {
  return (
    <MarketingShell>
      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#eef5fb_55%,#ffffff_100%)]">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
          <div>
            <p className="text-sm font-semibold tracking-[0.18em] text-[var(--ot-ocean)] uppercase">
              Talent Quest staffing
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--ot-navy)] sm:text-5xl">
              Discover talent.
              <br />
              Connect teams.
              <br />
              Succeed together.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-[var(--ot-muted)]">
              TalentQuest helps organizations fill critical roles — temporary,
              contract, and permanent — with people who are ready to contribute
              from day one.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/signup"
                className="rounded-md bg-[var(--ot-ocean)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--ot-ocean-hover)]"
              >
                Get Started
              </Link>
              <Link
                href="/login"
                className="text-sm font-semibold text-[var(--ot-navy)] hover:text-[var(--ot-ocean)]"
              >
                Existing user login
              </Link>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="rounded-3xl border border-[var(--ot-border)] bg-white p-8 shadow-xl shadow-[var(--ot-navy)]/10">
              <Image
                src="/talentquest-logo.png"
                alt="TalentQuest logo"
                width={420}
                height={294}
                className="h-auto w-full max-w-sm"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--ot-navy)]">
              Industries we serve
            </h2>
            <p className="mt-2 max-w-2xl text-[var(--ot-muted)]">
              Specialized recruiting across the roles staffing agencies place
              most often.
            </p>
          </div>
          <Link
            href="/industries"
            className="hidden text-sm font-semibold text-[var(--ot-ocean)] hover:underline sm:inline"
          >
            View all
          </Link>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {INDUSTRIES.slice(0, 6).map((industry) => (
            <Link
              key={industry.slug}
              href={`/industries#${industry.slug}`}
              className="rounded-xl border border-[var(--ot-border)] bg-white p-5 transition hover:border-[var(--ot-ocean)] hover:shadow-md"
            >
              <h3 className="font-semibold text-[var(--ot-navy)]">
                {industry.name}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ot-muted)]">
                {industry.summary}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </MarketingShell>
  );
}
