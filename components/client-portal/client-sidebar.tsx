"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
  PanelLeftClose,
  PanelLeftOpen,
  Pin,
  PinOff,
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

const CLIENT_DASHBOARD = "/client/dashboard";
const CLIENT_PIN_KEY = "cf-client-nav-pins-v2";
const CLIENT_ICONS_ONLY_KEY = "cf-client-sidebar-icons-only";

/** Only Dashboard is pinned by default. */
const DEFAULT_CLIENT_PINS = [CLIENT_DASHBOARD];

function readClientPins(): string[] {
  if (typeof window === "undefined") return [...DEFAULT_CLIENT_PINS];
  try {
    const raw = window.localStorage.getItem(CLIENT_PIN_KEY);
    if (!raw) return [...DEFAULT_CLIENT_PINS];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [...DEFAULT_CLIENT_PINS];
    const hrefs = parsed.filter((v): v is string => typeof v === "string");
    // Dashboard is always first / always present.
    const withoutDash = hrefs.filter((h) => h !== CLIENT_DASHBOARD);
    return [CLIENT_DASHBOARD, ...withoutDash];
  } catch {
    return [...DEFAULT_CLIENT_PINS];
  }
}

function orderClientNav(items: NavItem[], pinnedHrefs: string[]) {
  const byHref = new Map(items.map((item) => [item.href, item]));
  const pinnedSet = new Set(pinnedHrefs);

  const pinned: NavItem[] = [];
  if (byHref.has(CLIENT_DASHBOARD)) {
    pinned.push(byHref.get(CLIENT_DASHBOARD)!);
  }
  for (const href of pinnedHrefs) {
    if (href === CLIENT_DASHBOARD) continue;
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
  onTogglePin,
  lockPin,
}: {
  item: NavItem;
  iconsOnly: boolean;
  onNavigate?: () => void;
  pinned?: boolean;
  showPinControls?: boolean;
  onTogglePin?: () => void;
  /** Dashboard cannot be unpinned. */
  lockPin?: boolean;
}) {
  const pathname = usePathname();
  const active =
    pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon =
    ICONS[item.icon as keyof typeof ICONS] ?? LayoutDashboard;

  return (
    <div
      className={`group flex items-center gap-0.5 rounded-lg ${
        active ? "bg-[var(--cf-accent)]/20" : "hover:bg-white/10"
      }`}
    >
      <Link
        href={item.href}
        title={item.label}
        onClick={onNavigate}
        className={`flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-sm font-medium transition ${
          iconsOnly ? "justify-center px-2" : ""
        } ${active ? "text-white" : "text-white/70 group-hover:text-white"}`}
      >
        <Icon className="h-4 w-4 shrink-0" aria-hidden />
        {!iconsOnly ? <span className="truncate">{item.label}</span> : null}
        {iconsOnly ? <span className="sr-only">{item.label}</span> : null}
      </Link>
      {showPinControls && onTogglePin && !iconsOnly && !lockPin ? (
        <button
          type="button"
          onClick={onTogglePin}
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
          title="Dashboard stays pinned"
          className="mr-1 rounded p-1.5 text-[var(--cf-accent)]"
          aria-hidden
        >
          <Pin className="h-3.5 w-3.5 fill-current" />
        </span>
      ) : null}
    </div>
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
  const [pinnedHrefs, setPinnedHrefs] = useState<string[]>([
    ...DEFAULT_CLIENT_PINS,
  ]);
  const [ready, setReady] = useState(false);

  // On mobile drawer we always show labels even if desktop is icons-only.
  const iconsOnly = collapsed && !mobileOpen;

  useEffect(() => {
    setPinnedHrefs(readClientPins());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(CLIENT_PIN_KEY, JSON.stringify(pinnedHrefs));
  }, [pinnedHrefs, ready]);

  const { pinned, unpinned } = useMemo(
    () => orderClientNav(items, pinnedHrefs),
    [items, pinnedHrefs],
  );

  function togglePin(href: string) {
    if (href === CLIENT_DASHBOARD) return;
    setPinnedHrefs((prev) => {
      if (prev.includes(href)) {
        const next = prev.filter((h) => h !== href);
        return next.includes(CLIENT_DASHBOARD)
          ? next
          : [CLIENT_DASHBOARD, ...next];
      }
      const without = prev.filter((h) => h !== href && h !== CLIENT_DASHBOARD);
      return [CLIENT_DASHBOARD, ...without, href];
    });
  }

  const rail = (
    <aside
      className={`flex h-full flex-col bg-[var(--cf-navy)] text-white transition-[width] print:hidden ${
        iconsOnly ? "w-[5.75rem]" : "w-64"
      }`}
    >
      <div
        className={`border-b border-white/10 ${
          iconsOnly ? "px-2 py-3" : "px-4 py-4"
        }`}
      >
        {iconsOnly ? (
          <div className="flex flex-col items-center text-center gap-2">
            <Link
              href="/client/dashboard"
              className="inline-flex rounded-md bg-white p-2"
              title="TalentQuest"
              onClick={onMobileClose}
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
              onClick={onToggleCollapse}
              className="hidden rounded-md p-1.5 text-white/70 hover:bg-white/10 hover:text-white lg:inline-flex"
              title="Show tab titles"
              aria-label="Show tab titles"
              aria-pressed={true}
            >
              <PanelLeftOpen className="h-4 w-4" />
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
        ) : (
          <div className="relative">
            <button
              type="button"
              onClick={onToggleCollapse}
              className="absolute top-0 right-0 hidden rounded-md p-1.5 text-white/70 hover:bg-white/10 hover:text-white lg:inline-flex"
              title="Hide tab titles (icons only)"
              aria-label="Hide tab titles, show icons only"
              aria-pressed={false}
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onMobileClose}
              className="absolute top-0 right-0 inline-flex rounded-md p-1.5 text-white/70 hover:bg-white/10 lg:hidden"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex w-full flex-col items-center text-center">
              <Link
                href="/client/dashboard"
                className="inline-flex rounded-md bg-white p-2"
                title="TalentQuest"
                onClick={onMobileClose}
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
              <p className="mt-2 text-sm text-white/60">Employer Portal</p>
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
                  lockPin={item.href === CLIENT_DASHBOARD}
                  onTogglePin={() => togglePin(item.href)}
                  onNavigate={onMobileClose}
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
                  onNavigate={onMobileClose}
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
          onClick={onToggleCollapse}
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
            Dashboard stays pinned · hover to pin others
          </p>
        ) : null}
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
      className="inline-flex rounded-md border border-[var(--cf-border)] p-2 text-[var(--cf-ink)] hover:bg-[var(--cf-surface)] lg:hidden"
      aria-label="Open menu"
      suppressHydrationWarning
    >
      <Menu className="h-4 w-4" aria-hidden />
    </button>
  );
}

/** Load / save icons-only preference for the client shell. */
export function readClientIconsOnly(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(CLIENT_ICONS_ONLY_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeClientIconsOnly(iconsOnly: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      CLIENT_ICONS_ONLY_KEY,
      iconsOnly ? "1" : "0",
    );
  } catch {
    /* ignore */
  }
}
