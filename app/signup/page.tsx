import Link from "next/link";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { SignupForm } from "./signup-form";

export const metadata = {
  title: "Get Started · TalentQuest",
  description:
    "Request a TalentQuest account by emailing a recruiter with your details.",
};

export default function SignupPage() {
  return (
    <MarketingShell>
      <section className="mx-auto max-w-xl px-4 py-16 sm:px-6">
        <p className="text-sm font-semibold tracking-[0.16em] text-[var(--ot-ocean)] uppercase">
          Get Started
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--ot-navy)]">
          Create your account
        </h1>
        <p className="mt-4 leading-relaxed text-[var(--ot-muted)]">
          Tell us a bit about yourself and we&apos;ll email a recruiter to set
          up your account.
        </p>
        <div className="mt-8 rounded-xl border border-[var(--ot-border)] bg-white p-6 shadow-sm">
          <SignupForm />
        </div>
        <p className="mt-6 text-center text-sm text-[var(--ot-muted)]">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[var(--ot-ocean)]">
            Log in
          </Link>
        </p>
      </section>
    </MarketingShell>
  );
}
