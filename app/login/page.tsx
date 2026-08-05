import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-[var(--cf-surface)] px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold tracking-[0.14em] text-[var(--cf-accent)] uppercase">
            ContractFlow
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--cf-ink)]">
            Sign in
          </h1>
          <p className="mt-2 text-sm text-[var(--cf-muted)]">
            Contract-to-cash for staffing agencies. Use a demo account or the
            role switcher after login.
          </p>
        </div>
        <div className="rounded-xl border border-[var(--cf-border)] bg-white p-6 shadow-sm">
          <LoginForm />
        </div>
        <p className="mt-4 text-center text-xs text-[var(--cf-muted)]">
          Demo password: <code className="font-mono">DemoPass123!</code>
        </p>
      </div>
    </div>
  );
}
