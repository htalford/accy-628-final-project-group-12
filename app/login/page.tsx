import Image from "next/image";
import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage() {
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
            Client sign in
          </h1>
          <p className="mt-2 text-sm text-[var(--ot-muted)]">
            Demo sign in for employers and candidates. Any email and password
            will work — use a{" "}
            <span className="font-medium text-[var(--ot-navy)]">candidate@</span>{" "}
            email for the candidate portal.
          </p>
        </div>
        <div className="rounded-xl border border-[var(--ot-border)] bg-white p-6 shadow-sm">
          <LoginForm />
        </div>
        <p className="mt-4 text-center text-sm text-[var(--ot-muted)]">
          New here?{" "}
          <Link href="/signup" className="font-semibold text-[var(--ot-ocean)]">
            Get started
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-[var(--ot-muted)]">
          Talent Quest staff?{" "}
          <Link
            href="/careers/login"
            className="font-semibold text-[var(--ot-ocean)]"
          >
            Employee sign in
          </Link>
        </p>
        <p className="mt-2 text-center text-xs text-[var(--ot-muted)]">
          Any password works in demo mode.
        </p>
      </div>
    </div>
  );
}
