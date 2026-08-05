import Link from "next/link";
import { MarketingShell } from "@/components/marketing/marketing-shell";

export const metadata = {
  title: "Get Started · TalentQuest",
  description: "Create a TalentQuest account to request staffing support.",
};

export default function SignupPage() {
  return (
    <MarketingShell>
      <section className="mx-auto max-w-xl px-4 py-16 sm:px-6">
        <p className="text-sm font-semibold tracking-[0.16em] text-[var(--ot-ocean)] uppercase">
          Get Started
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--ot-navy)]">
          Client sign-up is on the way
        </h1>
        <p className="mt-4 leading-relaxed text-[var(--ot-muted)]">
          This page is reserved for the new-client sign-in / registration form
          another teammate is building. When that form ships, the Get Started
          button will land here.
        </p>
        <div className="mt-8 rounded-xl border border-[var(--ot-border)] bg-[var(--ot-mist)] p-5 text-sm text-[var(--ot-navy)]">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[var(--ot-ocean)]">
            Log in
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
