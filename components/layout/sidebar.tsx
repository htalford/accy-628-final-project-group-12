"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Briefcase,
  BriefcaseBusiness,
  Building2,
  Calendar,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  ClipboardList,
  Clock,
  FileSignature,
  FileText,
  History,
  LayoutDashboard,
  MessageSquare,
  MessagesSquare,
  Pin,
  PinOff,
  Receipt,
  Search,
  Send,
  TrendingUp,
  User,
  UserCircle,
  UserCog,
  UserRound,
  Users,
  Wallet,
  X,
} from "lucide-react";
import {
  getDashboardPath,
  getNavForRole,
  ROLE_LABELS,
} from "@/lib/auth/roles";
import type { UserRole } from "@/lib/types/database";
import type { NavIcon, NavItem } from "@/lib/auth/roles";
import { useShell } from "@/components/layout/shell-context";

const ICONS: Record<NavIcon, React.ComponentType<{ className?: string }>> = {
  "layout-dashboard": LayoutDashboard,
  "clipboard-check": ClipboardCheck,
  "clipboard-list": ClipboardList,
  briefcase: Briefcase,
  "file-text": FileText,
  "file-signature": FileSignature,
  clock: Clock,
  wallet: Wallet,
  receipt: Receipt,
  "circle-dollar-sign": CircleDollarSign,
  "trending-up": TrendingUp,
  "bar-chart-3": BarChart3,
  "messages-square": MessagesSquare,
  user: User,
  history: History,
  search: Search,
  send: Send,
  "circle-check": CheckCircle2,
  "message-square": MessageSquare,
  users: Users,
  "user-round": UserRound,
  "user-cog": UserCog,
  "briefcase-business": BriefcaseBusiness,
  calendar: Calendar,
  "building-2": Building2,
  "user-circle": UserCircle,
};

const CANDIDATE_DASHBOARD = "/candidate/dashboard";
const CANDIDATE_PIN_KEY = "cf-candidate-nav-pins";
const RECRUITER_DASHBOARD = "/recruiter/dashboard";
const RECRUITER_PIN_KEY = "cf-recruiter-nav-pins";

function readPinnedHrefs(storageKey: string, dashboardHref: string): string[] {
  if (typeof window === "undefined") return [dashboardHref];
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [dashboardHref];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [dashboardHref];
    const hrefs = parsed.filter((v): v is string => typeof v === "string");
    const withoutDash = hrefs.filter((h) => h !== dashboardHref);
    return [dashboardHref, ...withoutDash];
  } catch {
    return [dashboardHref];
  }
}

/** Candidate: Dashboard first (if pinned), then other pins in stored order, then alpha unpinned. */
function orderCandidateNav(items: NavItem[], pinnedHrefs: string[]) {
  const byHref = new Map(items.map((item) => [item.href, item]));
  const pinnedSet = new Set(pinnedHrefs);

  const pinned: NavItem[] = [];
  if (pinnedSet.has(CANDIDATE_DASHBOARD) && byHref.has(CANDIDATE_DASHBOARD)) {
    pinned.push(byHref.get(CANDIDATE_DASHBOARD)!);
  }
  for (const href of pinnedHrefs) {
    if (href === CANDIDATE_DASHBOARD) continue;
    const item = byHref.get(href);
    if (item) pinned.push(item);
  }

  const unpinned = items
    .filter((item) => !pinnedSet.has(item.href))
    .sort((a, b) => a.label.localeCompare(b.label));

  return { pinned, unpinned };
}

/**
 * Recruiter: Dashboard always first & locked pinned.
 * Other pinned tabs alphabetical below Dashboard.
 * Remaining unpinned tabs alphabetical.
 */
function orderRecruiterNav(items: NavItem[], pinnedHrefs: string[]) {
  const byHref = new Map(items.map((item) => [item.href, item]));
  const dashboard = byHref.get(RECRUITER_DASHBOARD);
  const pinnedSet = new Set(pinnedHrefs);

  const pinnedExtras = items
    .filter(
      (item) =>
        item.href !== RECRUITER_DASHBOARD && pinnedSet.has(item.href),
    )
    .sort((a, b) => a.label.localeCompare(b.label));

  const pinned: NavItem[] = dashboard
    ? [dashboard, ...pinnedExtras]
    : pinnedExtras;

  const unpinned = items
    .filter(
      (item) =>
        item.href !== RECRUITER_DASHBOARD && !pinnedSet.has(item.href),
    )
    .sort((a, b) => a.label.localeCompare(b.label));

  return { pinned, unpinned };
}

function NavLink({
  item,
  collapsed,
  onNavigate,
  pinned,
  showPinControls,
  pinLocked,
  onTogglePin,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
  pinned?: boolean;
  showPinControls?: boolean;
  pinLocked?: boolean;
  onTogglePin?: () => void;
}) {
  const pathname = usePathname();
  const active =
    pathname === item.href ||
    (item.href !== "/accounting/dashboard" &&
      item.href !== "/client/dashboard" &&
      pathname.startsWith(`${item.href}/`)) ||
    (item.href.endsWith("/dashboard") && pathname === item.href);
  const Icon = ICONS[item.icon];

  return (
    <div
      className={`group flex items-center gap-1 rounded-md ${
        active ? "bg-[var(--cf-accent)]/15" : "hover:bg-white/5"
      }`}
    >
      <Link
        href={item.href}
        title={item.label}
        onClick={onNavigate}
        className={`flex min-w-0 flex-1 items-center gap-3 px-3 py-2 text-sm font-medium transition ${
          collapsed ? "justify-center px-2" : ""
        } ${active ? "text-white" : "text-white/70 group-hover:text-white"}`}
      >
        <Icon className="h-4 w-4 shrink-0" aria-hidden />
        {!collapsed ? <span className="truncate">{item.label}</span> : null}
      </Link>
      {showPinControls && !collapsed ? (
        pinLocked ? (
          <span
            title={`${item.label} is always pinned`}
            aria-label={`${item.label} is always pinned`}
            className="mr-1 inline-flex rounded p-1.5 text-[var(--cf-accent)]"
          >
            <Pin className="h-3.5 w-3.5 fill-current" aria-hidden />
          </span>
        ) : onTogglePin ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onTogglePin();
            }}
            title={pinned ? `Unpin ${item.label}` : `Pin ${item.label}`}
            aria-label={pinned ? `Unpin ${item.label}` : `Pin ${item.label}`}
            className={`mr-1 rounded p-1.5 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
              pinned
                ? "text-[var(--cf-accent)]"
                : "text-white/45 hover:text-white"
            }`}
          >
            {pinned ? (
              <Pin className="h-3.5 w-3.5 fill-current" aria-hidden />
            ) : (
              <PinOff className="h-3.5 w-3.5" aria-hidden />
            )}
          </button>
        ) : null
      ) : null}
    </div>
  );
}

export function Sidebar({ role }: { role: UserRole }) {
  const items = getNavForRole(role);
  const isCandidate = role === "candidate";
  const isRecruiter = role === "recruiter";
  const usesTabPins = isCandidate || isRecruiter;
  const { collapsed, mobileOpen, setMobileOpen } = useShell();

  const dashboardHref = isRecruiter
    ? RECRUITER_DASHBOARD
    : CANDIDATE_DASHBOARD;
  const pinStorageKey = isRecruiter ? RECRUITER_PIN_KEY : CANDIDATE_PIN_KEY;

  const [pinnedHrefs, setPinnedHrefs] = useState<string[]>([dashboardHref]);
  const [ready, setReady] = useState(!usesTabPins);

  useEffect(() => {
    if (!usesTabPins) return;
    setPinnedHrefs(readPinnedHrefs(pinStorageKey, dashboardHref));
    setReady(true);
  }, [usesTabPins, pinStorageKey, dashboardHref]);

  useEffect(() => {
    if (!usesTabPins || !ready) return;
    const normalized = isRecruiter
      ? [
          RECRUITER_DASHBOARD,
          ...pinnedHrefs.filter((h) => h !== RECRUITER_DASHBOARD),
        ]
      : pinnedHrefs.length > 0
        ? pinnedHrefs
        : [CANDIDATE_DASHBOARD];
    window.localStorage.setItem(pinStorageKey, JSON.stringify(normalized));
  }, [usesTabPins, pinnedHrefs, ready, pinStorageKey, isRecruiter]);

  const { pinned, unpinned } = useMemo(() => {
    if (isRecruiter) return orderRecruiterNav(items, pinnedHrefs);
    if (isCandidate) return orderCandidateNav(items, pinnedHrefs);
    return { pinned: items, unpinned: [] as NavItem[] };
  }, [isCandidate, isRecruiter, items, pinnedHrefs]);

  function togglePin(href: string) {
    if (isRecruiter && href === RECRUITER_DASHBOARD) return;
    setPinnedHrefs((prev) => {
      const base = isRecruiter
        ? prev.includes(RECRUITER_DASHBOARD)
          ? prev
          : [RECRUITER_DASHBOARD, ...prev]
        : prev;
      if (base.includes(href)) {
        return base.filter((h) => h !== href);
      }
      return [...base, href];
    });
  }

  const showCollapsed = collapsed && !mobileOpen;

  const nav = (
    <>
      <div
        className={`border-b border-white/10 ${showCollapsed ? "px-2 py-3" : "px-4 py-4"}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className={showCollapsed ? "w-full" : "min-w-0 flex-1"}>
            <Link
              href={getDashboardPath(role)}
              className={`block rounded-md bg-white ${showCollapsed ? "p-1.5" : "p-2"}`}
              title="TalentQuest"
            >
              <Image
                src="/talentquest-logo.png"
                alt="TalentQuest"
                width={168}
                height={118}
                className={`w-auto ${showCollapsed ? "mx-auto h-8" : "h-11"}`}
                priority
              />
            </Link>
            {!showCollapsed ? (
              <p className="mt-2 text-sm text-white/60">
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
        {usesTabPins ? (
          <>
            {pinned.length > 0 ? (
              <div className="mb-1">
                {!showCollapsed ? (
                  <p className="px-3 pb-1 text-[10px] font-semibold tracking-[0.14em] text-white/35 uppercase">
                    Pinned
                  </p>
                ) : null}
                <div className="flex flex-col gap-0.5">
                  {pinned.map((item) => (
                    <NavLink
                      key={item.href}
                      item={item}
                      collapsed={showCollapsed}
                      pinned
                      showPinControls
                      pinLocked={
                        isRecruiter && item.href === RECRUITER_DASHBOARD
                      }
                      onTogglePin={() => togglePin(item.href)}
                      onNavigate={() => setMobileOpen(false)}
                    />
                  ))}
                </div>
              </div>
            ) : null}
            {unpinned.length > 0 ? (
              <div className={pinned.length > 0 ? "mt-2" : undefined}>
                {!showCollapsed && pinned.length > 0 ? (
                  <p className="px-3 pb-1 text-[10px] font-semibold tracking-[0.14em] text-white/35 uppercase">
                    More
                  </p>
                ) : null}
                <div className="flex flex-col gap-0.5">
                  {unpinned.map((item) => (
                    <NavLink
                      key={item.href}
                      item={item}
                      collapsed={showCollapsed}
                      showPinControls
                      onTogglePin={() => togglePin(item.href)}
                      onNavigate={() => setMobileOpen(false)}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </>
        ) : (
          items.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              collapsed={showCollapsed}
              onNavigate={() => setMobileOpen(false)}
            />
          ))
        )}
      </nav>
      {!showCollapsed ? (
        <div className="border-t border-white/10 px-4 py-3 text-xs text-white/40">
          {usesTabPins
            ? "Hover a tab to pin or unpin"
            : "ACCY 628 · Group 12"}
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
