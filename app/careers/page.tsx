import Link from "next/link";
import { MarketingShell } from "@/components/marketing/marketing-shell";

export const metadata = {
  title: "Careers at TQ · TalentQuest",
  description: "Join TalentQuest or log in as a current employee.",
};

const cards = [
  {
    href: "/careers/apply",
    title: "How to apply",
    body: "See the steps to apply for a role on the TalentQuest team.",
  },
  {
    href: "/careers/working-here",
    title: "Working at TalentQuest",
    body: "Learn about our culture, how recruiters work, and what we value.",
  },
  {
    href: "/careers/login",
    title: "Employee login",
    body: "Staff sign-in for recruiters, managers, accountants, and other Talent Quest team members.",
  },
];

export default function CareersPage() {
  return (
    <MarketingShell>
      <section className="bg-[var(--ot-navy)] px-4 py-14 text-white sm:px-6">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold tracking-[0.16em] text-[var(--ot-ocean)] uppercase">
            Careers at TQ
          </p>
          <h1 className="mt-3 text-4xl font-semibold">
            Build a career connecting people to opportunity.
          </h1>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-5 px-4 py-12 sm:grid-cols-3 sm:px-6">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-xl border border-[var(--ot-border)] bg-white p-6 transition hover:border-[var(--ot-ocean)] hover:shadow-md"
          >
            <h2 className="text-lg font-semibold text-[var(--ot-navy)]">
              {card.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--ot-muted)]">
              {card.body}
            </p>
          </Link>
        ))}
      </section>
    </MarketingShell>
  );
}
