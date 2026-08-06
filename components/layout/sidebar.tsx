"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Briefcase,
  BriefcaseBusiness,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
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
  PanelLeftClose,
  PanelLeftOpen,
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
  "book-open": BookOpen,
};

const PIN_KEYS: Partial<Record<UserRole, string>> = {
  candidate: "cf-candidate-nav-pins",
  recruiter: "cf-recruiter-nav-pins",
  accounting: "cf-accounting-nav-pins",
};

const ICONS_ONLY_KEYS: Partial<Record<UserRole, string>> = {
  candidate: "cf-candidate-sidebar-icons-only",
  recruiter: "cf-recruiter-sidebar-icons-only",
  accounting: "cf-accounting-sidebar-icons-only",
};

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

function readIconsOnly(storageKey: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(storageKey) === "1";
  } catch {
    return false;
  }
}

function writeIconsOnly(storageKey: string, iconsOnly: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey, iconsOnly ? "1" : "0");
  } catch {
    /* ignore */
  }
}

/** Dashboard/Home always first & locked; other pins keep stored order; unpinned keep nav order. */
function orderPinnedNav(items: NavItem[], pinnedHrefs: string[], dashboardHref: string) {
  const byHref = new Map(items.map((item) => [item.href, item]));
  const pinnedSet = new Set(pinnedHrefs);

  const pinned: NavItem[] = [];
  if (byHref.has(dashboardHref)) {
    pinned.push(byHref.get(dashboardHref)!);
  }
  for (const href of pinnedHrefs) {
    if (href === dashboardHref) continue;
    const item = byHref.get(href);
    if (item) pinned.push(item);
  }

  const unpinned = items.filter((item) => !pinnedSet.has(item.href));
  return { pinned, unpinned };
}

function NavLink({
  item,
  iconsOnly,
  onNavigate,
  pinned,
  showPinControls,
  lockPin,
  onTogglePin,
  showDot,
}: {
  item: NavItem;
  iconsOnly: boolean;
  onNavigate?: () => void;
  pinned?: boolean;
  showPinControls?: boolean;
  lockPin?: boolean;
  onTogglePin?: () => void;
  showDot?: boolean;
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
      className={`group flex items-center gap-0.5 rounded-lg ${
        active ? "bg-[var(--cf-accent)]/20" : "hover:bg-white/10"
      }`}
    >
      <Link
        href={item.href}
        title={
          showDot ? `${item.label} (unread messages)` : item.label
        }
        onClick={onNavigate}
        className={`relative flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-sm font-medium transition ${
          iconsOnly ? "justify-center px-2" : ""
        } ${active ? "text-white" : "text-white/70 group-hover:text-white"}`}
      >
        <span className="relative shrink-0">
          <Icon className="h-4 w-4" aria-hidden />
          {showDot ? (
            <span
              className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[var(--cf-accent)] ring-2 ring-[var(--cf-navy)]"
              aria-hidden
            />
          ) : null}
        </span>
        {!iconsOnly ? (
          <span className="min-w-0 flex-1 truncate leading-snug">
            {item.label}
          </span>
        ) : null}
        {iconsOnly ? <span className="sr-only">{item.label}</span> : null}
        {showDot && !iconsOnly ? (
          <span className="sr-only">Unread messages</span>
        ) : null}
      </Link>
      {showPinControls && onTogglePin && !iconsOnly && !lockPin ? (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onTogglePin();
          }}
          title={pinned ? `Unpin ${item.label}` : `Pin ${item.label}`}
          aria-label={pinned ? `Unpin ${item.label}` : `Pin ${item.label}`}
          className={`mr-1 rounded p-1.5 transition ${
            pinned
              ? "text-[var(--cf-accent)] opacity-100"
              : "text-white/40 opacity-0 group-hover:opacity-100 hover:text-white"
          }`}
        >
          {pinned ? (
            <Pin className="h-3.5 w-3.5 fill-current" aria-hidden />
          ) : (
            <PinOff className="h-3.5 w-3.5" aria-hidden />
          )}
        </button>
      ) : null}
      {showPinControls && pinned && lockPin && !iconsOnly ? (
        <span
          title={`${item.label} stays pinned`}
          className="mr-1 rounded p-1.5 text-[var(--cf-accent)]"
          aria-hidden
        >
          <Pin className="h-3.5 w-3.5 fill-current" />
        </span>
      ) : null}
    </div>
  );
}

export function Sidebar({
  role,
  unreadMessageCount = 0,
}: {
  role: UserRole;
  unreadMessageCount?: number;
}) {
  const items = getNavForRole(role);
  const isCandidate = role === "candidate";
  const homePath = getDashboardPath(role);
  const dashboardHref = homePath;
  const pinStorageKey = PIN_KEYS[role] ?? `cf-${role}-nav-pins`;
  const iconsOnlyKey = ICONS_ONLY_KEYS[role] ?? `cf-${role}-sidebar-icons-only`;
  const lockedHomeLabel =
    items.find((item) => item.href === dashboardHref)?.label ?? "Dashboard";

  const showMessagesDot = isCandidate && unreadMessageCount > 0;
  function navShowDot(href: string) {
    return showMessagesDot && href === "/candidate/messages";
  }

  const { mobileOpen, setMobileOpen } = useShell();

  const [pinnedHrefs, setPinnedHrefs] = useState<string[]>([dashboardHref]);
  const [iconsOnlyPref, setIconsOnlyPref] = useState(false);
  const [ready, setReady] = useState(false);

  // Mobile drawer always shows labels even if desktop is icons-only.
  const iconsOnly = iconsOnlyPref && !mobileOpen;

  useEffect(() => {
    setPinnedHrefs(readPinnedHrefs(pinStorageKey, dashboardHref));
    setIconsOnlyPref(readIconsOnly(iconsOnlyKey));
    setReady(true);
  }, [pinStorageKey, dashboardHref, iconsOnlyKey]);

  useEffect(() => {
    if (!ready) return;
    const normalized = [
      dashboardHref,
      ...pinnedHrefs.filter((h) => h !== dashboardHref),
    ];
    window.localStorage.setItem(pinStorageKey, JSON.stringify(normalized));
  }, [pinnedHrefs, ready, pinStorageKey, dashboardHref]);

  const { pinned, unpinned } = useMemo(
    () => orderPinnedNav(items, pinnedHrefs, dashboardHref),
    [items, pinnedHrefs, dashboardHref],
  );

  function togglePin(href: string) {
    if (href === dashboardHref) return;
    setPinnedHrefs((prev) => {
      if (prev.includes(href)) {
        const next = prev.filter((h) => h !== href);
        return next.includes(dashboardHref)
          ? next
          : [dashboardHref, ...next];
      }
      const without = prev.filter((h) => h !== href && h !== dashboardHref);
      return [dashboardHref, ...without, href];
    });
  }

  function toggleIconsOnly() {
    setIconsOnlyPref((prev) => {
      const next = !prev;
      writeIconsOnly(iconsOnlyKey, next);
      return next;
    });
  }

  const nav = (
    <>
      <div
        className={`border-b border-white/10 ${
          iconsOnly ? "px-2 py-3" : "px-4 py-4"
        }`}
      >
        {iconsOnly ? (
          <div className="flex flex-col items-center gap-2 text-center">
            <Link
              href={homePath}
              className="inline-flex rounded-md bg-white p-2"
              title="TalentQuest"
              onClick={() => setMobileOpen(false)}
            >
              <Image
                src="/talentquest-logo.png"
                alt="TalentQuest"
                width={168}
                height={118}
                className="mx-auto h-8 w-auto object-contain"
                priority
              />
            </Link>
            <button
              type="button"
              onClick={toggleIconsOnly}
              className="hidden rounded-md p-1.5 text-white/70 hover:bg-white/10 hover:text-white lg:inline-flex"
              title="Show tab titles"
              aria-label="Show tab titles"
              aria-pressed={true}
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="inline-flex rounded-md p-1.5 text-white/70 hover:bg-white/10 lg:hidden"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="relative">
            <button
              type="button"
              onClick={toggleIconsOnly}
              className="absolute top-0 right-0 hidden rounded-md p-1.5 text-white/70 hover:bg-white/10 hover:text-white lg:inline-flex"
              title="Hide tab titles (icons only)"
              aria-label="Hide tab titles, show icons only"
              aria-pressed={false}
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute top-0 right-0 inline-flex rounded-md p-1.5 text-white/70 hover:bg-white/10 lg:hidden"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex w-full flex-col items-center text-center">
              <Link
                href={homePath}
                className="inline-flex rounded-md bg-white p-2"
                title="TalentQuest"
                onClick={() => setMobileOpen(false)}
              >
                <Image
                  src="/talentquest-logo.png"
                  alt="TalentQuest"
                  width={168}
                  height={118}
                  className="mx-auto h-11 w-auto object-contain"
                  priority
                />
              </Link>
              <p className="mt-2 text-sm text-white/60">
                {ROLE_LABELS[role]} Portal
              </p>
            </div>
          </div>
        )}
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
        {pinned.length > 0 ? (
          <div className="mb-1">
            {!iconsOnly ? (
              <p className="px-3 pb-1 text-[10px] font-semibold tracking-[0.14em] text-white/35 uppercase">
                Pinned
              </p>
            ) : null}
            <div className="flex flex-col gap-0.5">
              {pinned.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  iconsOnly={iconsOnly}
                  pinned
                  showPinControls
                  lockPin={item.href === dashboardHref}
                  onTogglePin={() => togglePin(item.href)}
                  onNavigate={() => setMobileOpen(false)}
                  showDot={navShowDot(item.href)}
                />
              ))}
            </div>
          </div>
        ) : null}
        {unpinned.length > 0 ? (
          <div className={pinned.length > 0 ? "mt-2" : undefined}>
            {!iconsOnly && pinned.length > 0 ? (
              <p className="px-3 pb-1 text-[10px] font-semibold tracking-[0.14em] text-white/35 uppercase">
                More
              </p>
            ) : null}
            <div className="flex flex-col gap-0.5">
              {unpinned.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  iconsOnly={iconsOnly}
                  showPinControls
                  onTogglePin={() => togglePin(item.href)}
                  onNavigate={() => setMobileOpen(false)}
                  showDot={navShowDot(item.href)}
                />
              ))}
            </div>
          </div>
        ) : null}
      </nav>
      <div
        className={`border-t border-white/10 py-3 ${
          iconsOnly ? "px-1" : "px-3"
        }`}
      >
        <button
          type="button"
          onClick={toggleIconsOnly}
          className={`hidden w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[10px] text-white/50 transition hover:bg-white/10 hover:text-white/80 lg:flex ${
            iconsOnly ? "justify-center px-1" : ""
          }`}
          title={
            iconsOnly
              ? "Show tab titles"
              : "Hide tab titles (icons only)"
          }
          aria-label={
            iconsOnly
              ? "Show tab titles"
              : "Hide tab titles, show icons only"
          }
        >
          {iconsOnly ? (
            <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
          ) : (
            <>
              <ChevronLeft className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>Hide titles · icons only</span>
            </>
          )}
        </button>
        {!iconsOnly ? (
          <p className="mt-2 px-1 text-[10px] text-white/35">
            {lockedHomeLabel} stays pinned · hover to pin others
          </p>
        ) : null}
      </div>
    </>
  );

  if (!ready) {
    return (
      <aside
        className="hidden w-64 shrink-0 bg-[var(--cf-navy)] lg:block"
        aria-hidden
      />
    );
  }

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
          iconsOnlyPref ? "w-[5.75rem]" : "w-64"
        }`}
      >
        {nav}
      </aside>
    </>
  );
}
