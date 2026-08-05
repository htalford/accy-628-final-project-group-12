import Link from "next/link";
import type { ProfileCompletion } from "@/lib/candidate/profile-completion";

export function ProfileCompletionCard({
  completion,
  showCta = true,
}: {
  completion: ProfileCompletion;
  showCta?: boolean;
}) {
  const { percent, missing } = completion;

  return (
    <section className="rounded-2xl border border-[var(--cf-border)] bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-[var(--cf-ink)]">
        Profile {percent}% Complete
      </h2>

      <div
        className="mt-4 h-3 overflow-hidden rounded-full bg-[var(--cf-border)]"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Profile completion"
      >
        <div
          className="h-full rounded-full bg-[var(--cf-accent)] transition-[width]"
          style={{ width: `${percent}%` }}
        />
      </div>

      {missing.length > 0 ? (
        <div className="mt-4">
          <p className="text-sm font-medium text-[var(--cf-ink)]">Missing:</p>
          <ul className="mt-2 space-y-1.5 text-sm text-[var(--cf-muted)]">
            {missing.map((item) => (
              <li key={item.id} className="flex items-center gap-2">
                <span className="font-semibold text-red-600" aria-hidden>
                  ✕
                </span>
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-4 text-sm text-[var(--cf-muted)]">
          Nice work — your candidate profile is complete.
        </p>
      )}

      {showCta ? (
        <Link
          href="/candidate/profile"
          className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[var(--cf-navy)] transition hover:text-[var(--cf-accent)]"
        >
          Complete Profile
          <span aria-hidden>→</span>
        </Link>
      ) : null}
    </section>
  );
}
