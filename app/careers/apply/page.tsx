import { MarketingShell } from "@/components/marketing/marketing-shell";

export const metadata = {
  title: "How to Apply · TalentQuest",
};

const steps = [
  {
    title: "1. Review open roles",
    body: "Look through recruiter, account management, operations, and support openings that match your background.",
  },
  {
    title: "2. Submit your application",
    body: "Send a résumé and a short note about the industries or roles you know best. Tell us whether you prefer client-facing or candidate-facing work.",
  },
  {
    title: "3. Interview with the team",
    body: "You’ll meet a hiring manager and a peer recruiter. We look for judgment, communication, and a genuine interest in helping people find work.",
  },
  {
    title: "4. Offer and onboarding",
    body: "If it’s a fit, we’ll walk through compensation, tools, and your first desk. New hires train with a mentor before owning a full book of business.",
  },
];

export default function ApplyPage() {
  return (
    <MarketingShell>
      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <p className="text-sm font-semibold tracking-[0.16em] text-[var(--ot-ocean)] uppercase">
          Careers at TQ
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-[var(--ot-navy)]">
          How to apply for a job at TalentQuest
        </h1>
        <p className="mt-4 text-[var(--ot-muted)]">
          These steps are for joining the TalentQuest staff — recruiters,
          coordinators, and internal operations — not for contractor placements
          with our clients.
        </p>
        <ol className="mt-10 grid gap-5">
          {steps.map((step) => (
            <li
              key={step.title}
              className="rounded-xl border border-[var(--ot-border)] bg-white p-5"
            >
              <h2 className="font-semibold text-[var(--ot-navy)]">{step.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ot-muted)]">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
        <p className="mt-8 text-sm leading-relaxed text-[var(--ot-muted)]">
          Interested in working at TalentQuest? Email{" "}
          <a
            href="mailto:careers@talentquest.com"
            className="font-semibold text-[var(--ot-ocean)] hover:underline"
          >
            careers@talentquest.com
          </a>{" "}
          to get your application started.
        </p>
      </section>
    </MarketingShell>
  );
}
