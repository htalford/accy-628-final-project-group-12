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
const CLIENT_CANDIDATES = "/client/candidates";
const CLIENT_PIN_KEY = "cf-client-nav-pins";

/** Default: Dashboard then Candidates, then remaining nav order. */
const DEFAULT_CLIENT_PINS = [CLIENT_DASHBOARD, CLIENT_CANDIDATES];

function readClientPins(): string[] {
  if (typeof window === "undefined") return [...DEFAULT_CLIENT_PINS];
  try {
    const raw = window.localStorage.getItem(CLIENT_PIN_KEY);
    if (!raw) return [...DEFAULT_CLIENT_PINS];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [...DEFAULT_CLIENT_PINS];
    const hrefs = parsed.filter((v): v is string => typeof v === "string");
    return hrefs.length > 0 ? hrefs : [...DEFAULT_CLIENT_PINS];
  } catch {
    return [...DEFAULT_CLIENT_PINS];
  }
}

function orderClientNav(items: NavItem[], pinnedHrefs: string[]) {
  const byHref = new Map(items.map((item) => [item.href, item]));
  const pinnedSet = new Set(pinnedHrefs);

  const pinned: NavItem[] = [];
  // Keep Dashboard first when pinned, then Candidates, then other pins.
  for (const preferred of [CLIENT_DASHBOARD, CLIENT_CANDIDATES]) {
    if (pinnedSet.has(preferred) && byHref.has(preferred)) {
      pinned.push(byHref.get(preferred)!);
    }
  }
  for (const href of pinnedHrefs) {
    if (href === CLIENT_DASHBOARD || href === CLIENT_CANDIDATES) continue;
    const item = byHref.get(href);
    if (item) pinned.push(item);
  }

  const unpinned = items.filter((item) => !pinnedSet.has(item.href));
  return { pinned, unpinned };
}

function NavLink({
  item,
  collapsed,
  onNavigate,
  pinned,
  showPinControls,
  onTogglePin,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
  pinned?: boolean;
  showPinControls?: boolean;
  onTogglePin?: () => void;
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
          collapsed ? "justify-center px-2" : ""
        } ${active ? "text-white" : "text-white/70 group-hover:text-white"}`}
      >
        <Icon className="h-4 w-4 shrink-0" aria-hidden />
        {!collapsed ? <span className="truncate">{item.label}</span> : null}
      </Link>
      {showPinControls && onTogglePin && !collapsed ? (
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
    setPinnedHrefs((prev) => {
      if (prev.includes(href)) {
        // Keep at least Dashboard in the pinned list when unpinning others.
        const next = prev.filter((h) => h !== href);
        return next.length > 0 ? next : [CLIENT_DASHBOARD];
      }
      if (href === CLIENT_CANDIDATES) {
        // Insert Candidates right after Dashboard when present.
        const without = prev.filter((h) => h !== href);
        const dashIdx = without.indexOf(CLIENT_DASHBOARD);
        if (dashIdx >= 0) {
          return [
            ...without.slice(0, dashIdx + 1),
            CLIENT_CANDIDATES,
            ...without.slice(dashIdx + 1),
          ];
        }
        return [CLIENT_CANDIDATES, ...without];
      }
      return [...prev, href];
    });
  }

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
        {pinned.length > 0 ? (
          <div className="mb-1">
            {!collapsed ? (
              <p className="px-3 pb-1 text-[10px] font-semibold tracking-[0.14em] text-white/35 uppercase">
                Pinned
              </p>
            ) : null}
            <div className="flex flex-col gap-0.5">
              {pinned.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  collapsed={collapsed}
                  pinned
                  showPinControls
                  onTogglePin={() => togglePin(item.href)}
                  onNavigate={onMobileClose}
                />
              ))}
            </div>
          </div>
        ) : null}
        {unpinned.length > 0 ? (
          <div className={pinned.length > 0 ? "mt-2" : undefined}>
            {!collapsed && pinned.length > 0 ? (
              <p className="px-3 pb-1 text-[10px] font-semibold tracking-[0.14em] text-white/35 uppercase">
                More
              </p>
            ) : null}
            <div className="flex flex-col gap-0.5">
              {unpinned.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  collapsed={collapsed}
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
        className={`border-t border-white/10 py-3 text-[10px] text-white/40 ${
          collapsed ? "px-1 text-center" : "px-4"
        }`}
      >
        {collapsed ? "G12" : "Hover a tab to pin or unpin"}
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
