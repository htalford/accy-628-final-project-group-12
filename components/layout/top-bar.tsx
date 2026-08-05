import { signOut } from "@/app/actions/demo-switch-role";
import { ROLE_LABELS } from "@/lib/auth/roles";
import type { AppUser } from "@/lib/types/database";

export function TopBar({ user }: { user: AppUser }) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-[var(--cf-border)] bg-white px-6">
      <div>
        <p className="text-sm font-medium text-[var(--cf-ink)]">{user.name}</p>
        <p className="text-xs text-[var(--cf-muted)]">
          {ROLE_LABELS[user.role]} · {user.email}
        </p>
      </div>
      <form action={signOut}>
        <button
          type="submit"
          className="rounded-md border border-[var(--cf-border)] px-3 py-1.5 text-sm font-medium text-[var(--cf-ink)] transition hover:bg-[var(--cf-surface)]"
        >
          Sign out
        </button>
      </form>
    </header>
  );
}
