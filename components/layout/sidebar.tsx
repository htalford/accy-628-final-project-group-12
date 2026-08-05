"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Briefcase,
  CircleDollarSign,
  ClipboardCheck,
  Clock,
  FileSignature,
  FileText,
  LayoutDashboard,
  MessagesSquare,
  Receipt,
  TrendingUp,
  User,
  Wallet,
  X,
} from "lucide-react";
import { getNavForRole, ROLE_LABELS } from "@/lib/auth/roles";
import type { UserRole } from "@/lib/types/database";
import type { NavIcon, NavItem } from "@/lib/auth/roles";
import { useShell } from "@/components/layout/shell-context";

const ICONS: Record<NavIcon, React.ComponentType<{ className?: string }>> = {
  "layout-dashboard": LayoutDashboard,
  "clipboard-check": ClipboardCheck,
  briefcase: Briefcase,
  "file-text": FileText,
  clock: Clock,
  wallet: Wallet,
  receipt: Receipt,
  "file-signature": FileSignature,
  "circle-dollar-sign": CircleDollarSign,
  "trending-up": TrendingUp,
  "bar-chart-3": BarChart3,
  "messages-square": MessagesSquare,
  user: User,
};

function NavLink({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active =
    pathname === item.href ||
    (item.href !== "/accounting/dashboard" &&
      pathname.startsWith(`${item.href}/`)) ||
    (item.href.endsWith("/dashboard") && pathname === item.href);
  const Icon = ICONS[item.icon];

  return (
    <Link
      href={item.href}
      title={item.label}
      onClick={onNavigate}
      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${
        collapsed ? "justify-center px-2" : ""
      } ${
        active
          ? "bg-[var(--cf-accent)]/15 text-white"
          : "text-white/70 hover:bg-white/5 hover:text-white"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      {!collapsed ? <span className="truncate">{item.label}</span> : null}
    </Link>
  );
}

export function Sidebar({ role }: { role: UserRole }) {
  const items = getNavForRole(role);
  const { collapsed, mobileOpen, setMobileOpen } = useShell();

  const nav = (
    <>
      <div
        className={`border-b border-white/10 ${collapsed ? "px-3 py-4" : "px-5 py-5"}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className={collapsed ? "w-full text-center" : ""}>
            <p className="text-xs font-semibold tracking-[0.16em] text-[var(--cf-accent)] uppercase">
              {collapsed ? "CF" : "ContractFlow"}
            </p>
            {!collapsed ? (
              <p className="mt-1 text-sm text-white/60">
                {ROLE_LABELS[role]} portal
              </p>
            ) : null}
          </div>
          <button
            type="button"
            className="rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {items.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            collapsed={collapsed && !mobileOpen}
            onNavigate={() => setMobileOpen(false)}
          />
        ))}
      </nav>
      {!collapsed || mobileOpen ? (
        <div className="border-t border-white/10 px-4 py-3 text-xs text-white/40">
          ACCY 628 · Group 12
        </div>
      ) : null}
    </>
  );

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-label="Close sidebar overlay"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[var(--cf-navy)] text-white transition-transform lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {nav}
      </aside>

      <aside
        className={`hidden shrink-0 flex-col bg-[var(--cf-navy)] text-white transition-[width] lg:flex ${
          collapsed ? "w-[4.25rem]" : "w-60"
        }`}
      >
        {nav}
      </aside>
    </>
  );
}
