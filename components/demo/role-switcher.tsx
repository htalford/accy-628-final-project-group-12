"use client";

import { useTransition } from "react";
import { Users } from "lucide-react";
import { switchDemoRole } from "@/app/actions/demo-switch-role";
import { DEMO_ACCOUNTS, ROLE_LABELS, USER_ROLES } from "@/lib/auth/roles";
import type { UserRole } from "@/lib/types/database";

export function RoleSwitcher({ currentRole }: { currentRole: UserRole }) {
  const [pending, startTransition] = useTransition();

  function onSwitch(role: UserRole) {
    if (role === currentRole) return;
    startTransition(async () => {
      await switchDemoRole(role);
    });
  }

  return (
    <div className="fixed right-4 bottom-4 z-50 w-64 rounded-xl border border-[var(--cf-border)] bg-white p-3 shadow-lg">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide text-[var(--cf-muted)] uppercase">
        <Users className="h-3.5 w-3.5" aria-hidden />
        Demo role switcher
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {USER_ROLES.map((role) => {
          const active = role === currentRole;
          return (
            <button
              key={role}
              type="button"
              disabled={pending}
              onClick={() => onSwitch(role)}
              className={`rounded-md px-2 py-2 text-left text-xs transition disabled:opacity-60 ${
                active
                  ? "bg-[var(--cf-navy)] text-white"
                  : "bg-[var(--cf-surface)] text-[var(--cf-ink)] hover:bg-[var(--cf-accent)]/10"
              }`}
            >
              <span className="block font-semibold">{ROLE_LABELS[role]}</span>
              <span className={`block truncate ${active ? "text-white/70" : "text-[var(--cf-muted)]"}`}>
                {DEMO_ACCOUNTS[role].label}
              </span>
            </button>
          );
        })}
      </div>
      {pending ? (
        <p className="mt-2 text-[11px] text-[var(--cf-muted)]">Switching…</p>
      ) : null}
    </div>
  );
}
