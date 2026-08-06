"use client";

import { useTransition } from "react";
import { switchDemoRole } from "@/app/actions/demo-switch-role";
import { DEMO_ACCOUNTS, ROLE_LABELS, USER_ROLES } from "@/lib/auth/roles";
import type { UserRole } from "@/lib/types/database";

export function DemoRoleMenu({
  currentRole,
  onSelect,
}: {
  currentRole: UserRole;
  onSelect?: () => void;
}) {
  const [pending, startTransition] = useTransition();

  function onSwitch(role: UserRole) {
    if (role === currentRole || pending) return;
    onSelect?.();
    startTransition(async () => {
      await switchDemoRole(role);
    });
  }

  return (
    <div className="border-b border-[var(--cf-border)] py-1">
      <p className="px-3 py-1.5 text-[11px] font-semibold tracking-wide text-[var(--cf-muted)] uppercase">
        Switch role
      </p>
      {USER_ROLES.map((role) => {
        const active = role === currentRole;
        return (
          <button
            key={role}
            type="button"
            disabled={pending}
            onClick={() => onSwitch(role)}
            className={`flex w-full flex-col px-3 py-2 text-left transition disabled:opacity-60 ${
              active
                ? "bg-[var(--cf-navy)]/10 text-[var(--cf-navy)]"
                : "text-[var(--cf-ink)] hover:bg-[var(--cf-surface)]"
            }`}
          >
            <span className="text-sm font-medium">{ROLE_LABELS[role]}</span>
            <span
              className={`truncate text-xs ${
                active ? "text-[var(--cf-navy)]/70" : "text-[var(--cf-muted)]"
              }`}
            >
              {DEMO_ACCOUNTS[role].label}
            </span>
          </button>
        );
      })}
      {pending ? (
        <p className="px-3 pb-1.5 text-[11px] text-[var(--cf-muted)]">
          Switching…
        </p>
      ) : null}
    </div>
  );
}
