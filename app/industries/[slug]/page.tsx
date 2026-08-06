import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { INDUSTRIES } from "@/lib/marketing/content";

type IndustrySlug = (typeof INDUSTRIES)[number]["slug"];

export function generateStaticParams() {
  return INDUSTRIES.map((industry) => ({ slug: industry.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const industry = INDUSTRIES.find((item) => item.slug === slug);
  if (!industry) return { title: "Industry · TalentQuest" };
  return {
    title: `${industry.name} Staffing · TalentQuest`,
    description: industry.summary,
  };
}

export default async function IndustryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const industry = INDUSTRIES.find((item) => item.slug === (slug as IndustrySlug));
  if (!industry) notFound();

  return (
    <MarketingShell>
      <section className="bg-[var(--ot-navy)] px-4 py-14 text-white sm:px-6">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-semibold tracking-[0.16em] text-[var(--ot-ocean)] uppercase">
            Industries We Serve
          </p>
          <h1 className="mt-3 text-4xl font-semibold">{industry.name}</h1>
          <p className="mt-4 text-lg text-white/80">{industry.summary}</p>
        </div>
      </section>
      <section className="mx-auto max-w-3xl space-y-8 px-4 py-12 sm:px-6">
        <div>
          <h2 className="text-xl font-semibold text-[var(--ot-navy)]">
            How TalentQuest staffs this industry
          </h2>
          <p className="mt-3 leading-relaxed text-[var(--ot-muted)]">
            {industry.overview}
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-[var(--ot-navy)]">
            Roles we commonly place
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-[var(--ot-muted)]">
            {industry.roles.map((role) => (
              <li key={role}>{role}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-[var(--ot-border)] bg-[var(--ot-mist)] p-5">
          <h2 className="text-lg font-semibold text-[var(--ot-navy)]">
            Assignment types & what to expect
          </h2>
          <p className="mt-2 leading-relaxed text-[var(--ot-muted)]">
            {industry.staffingNotes}
          </p>
        </div>
        <div>
          <Link
            href="/industries"
            className="inline-flex items-center gap-2 rounded-md bg-[var(--ot-ocean)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--ot-ocean-hover)]"
          >
            ← All industries
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
