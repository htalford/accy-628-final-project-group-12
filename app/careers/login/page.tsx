import Image from "next/image";
import Link from "next/link";
import { StaffLoginForm } from "./staff-login-form";

export const metadata = {
  title: "Employee Sign In · TalentQuest",
  description: "Demo sign in for Talent Quest accounting and recruiter staff.",
};

export default function StaffLoginPage() {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-[var(--ot-surface)] px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex justify-center">
            <Image
              src="/talentquest-logo.png"
              alt="TalentQuest"
              width={180}
              height={126}
              className="h-20 w-auto"
              priority
            />
          </Link>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--ot-navy)]">
            Employee sign in
          </h1>
          <p className="mt-2 text-sm text-[var(--ot-muted)]">
            Demo sign in for Talent Quest staff. Any username and password will
            work — use{" "}
            <span className="font-medium text-[var(--ot-navy)]">accounting</span>{" "}
            for the accounting portal; otherwise you enter as a recruiter.
          </p>
        </div>
        <div className="rounded-xl border border-[var(--ot-border)] bg-white p-6 shadow-sm">
          <StaffLoginForm />
        </div>
        <p className="mt-4 text-center text-sm text-[var(--ot-muted)]">
          Looking for client access?{" "}
          <Link href="/login" className="font-semibold text-[var(--ot-ocean)]">
            Client sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
