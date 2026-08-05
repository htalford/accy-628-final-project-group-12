"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileSignature,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Search,
  Send,
  User,
  Wallet,
} from "lucide-react";
import { getNavForRole, ROLE_LABELS } from "@/lib/auth/roles";
import type { UserRole } from "@/lib/types/database";
import type { NavItem } from "@/lib/auth/roles";

const ICONS = {
  "layout-dashboard": LayoutDashboard,
  "clipboard-check": ClipboardCheck,
  briefcase: Briefcase,
  "file-text": FileText,
  clock: Clock,
  search: Search,
  "file-signature": FileSignature,
  send: Send,
  wallet: Wallet,
  "circle-check": CheckCircle2,
  "message-square": MessageSquare,
  user: User,
} as const;

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = ICONS[item.icon];

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${
        active
          ? "bg-[var(--cf-accent)]/15 text-white"
          : "text-white/70 hover:bg-white/5 hover:text-white"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      {item.label}
    </Link>
  );
}

export function Sidebar({ role }: { role: UserRole }) {
  const items = getNavForRole(role);

  return (
    <aside className="flex w-60 shrink-0 flex-col bg-[var(--cf-navy)] text-white">
      <div className="border-b border-white/10 px-5 py-5">
        <p className="text-xs font-semibold tracking-[0.16em] text-[var(--cf-accent)] uppercase">
          ContractFlow
        </p>
        <p className="mt-1 text-sm text-white/60">{ROLE_LABELS[role]} portal</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {items.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>
      <div className="border-t border-white/10 px-4 py-3 text-xs text-white/40">
        ACCY 628 · Group 12
      </div>
    </aside>
  );
}
