"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Clock,
  FileSignature,
  FileText,
  LayoutDashboard,
  Menu,
  MessagesSquare,
  Receipt,
  UserCog,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { getNavForRole } from "@/lib/auth/roles";
import type { NavItem } from "@/lib/auth/roles";

const ICONS = {
  "layout-dashboard": LayoutDashboard,
  "clipboard-check": ClipboardCheck,
  "clipboard-list": ClipboardList,
  briefcase: Briefcase,
  "file-text": FileText,
  "file-signature": FileSignature,
  clock: Clock,
  users: Users,
  "user-round": UserRound,
  receipt: Receipt,
  "messages-square": MessagesSquare,
  "user-cog": UserCog,
} as const;

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
    pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon =
    ICONS[item.icon as keyof typeof ICONS] ?? LayoutDashboard;

  return (
    <Link
      href={item.href}
      title={item.label}
      onClick={onNavigate}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
        collapsed ? "justify-center px-2" : ""
      } ${
        active
          ? "bg-[var(--cf-accent)]/20 text-white"
          : "text-white/70 hover:bg-white/10 hover:text-white"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      {!collapsed ? <span>{item.label}</span> : null}
    </Link>
  );
}

export function ClientSidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onMobileClose,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}) {
  const items = getNavForRole("employer");

  const rail = (
    <aside
      className={`flex h-full flex-col bg-[var(--cf-navy)] text-white transition-[width] print:hidden ${
        collapsed ? "w-[72px]" : "w-64"
      }`}
    >
      <div
        className={`border-b border-white/10 ${
          collapsed ? "px-2 py-3" : "px-4 py-4"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className={collapsed ? "w-full" : "min-w-0 flex-1"}>
            <Link
              href="/client/dashboard"
              className={`block rounded-md bg-white ${collapsed ? "p-1.5" : "p-2"}`}
              title="TalentQuest"
              onClick={onMobileClose}
            >
              <Image
                src="/talentquest-logo.png"
                alt="TalentQuest"
                width={168}
                height={118}
                className={`w-auto ${collapsed ? "mx-auto h-8" : "h-11"}`}
                priority
              />
            </Link>
            {!collapsed ? (
              <p className="mt-2 text-sm text-white/60">Client Portal</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden rounded-md p-1.5 text-white/70 hover:bg-white/10 hover:text-white lg:inline-flex"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            onClick={onMobileClose}
            className="inline-flex rounded-md p-1.5 text-white/70 hover:bg-white/10 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
        {items.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            collapsed={collapsed}
            onNavigate={onMobileClose}
          />
        ))}
      </nav>
      <div
        className={`border-t border-white/10 py-3 text-[10px] text-white/40 ${
          collapsed ? "px-1 text-center" : "px-4"
        }`}
      >
        {collapsed ? "G12" : "ACCY 628 · Group 12"}
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden shrink-0 lg:block">{rail}</div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-[var(--cf-ink)]/40"
            aria-label="Close menu overlay"
            onClick={onMobileClose}
          />
          <div className="relative z-10 h-full shadow-xl">{rail}</div>
        </div>
      ) : null}
    </>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex rounded-lg border border-[var(--cf-border)] p-2 text-[var(--cf-ink)] lg:hidden"
      aria-label="Open menu"
      suppressHydrationWarning
    >
      <Menu className="h-4 w-4" aria-hidden />
    </button>
  );
}
