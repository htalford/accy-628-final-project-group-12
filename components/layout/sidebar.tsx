"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
  Pin,
  PinOff,
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

const CANDIDATE_DASHBOARD = "/candidate/dashboard";
const CANDIDATE_PIN_KEY = "cf-candidate-nav-pins";

function readCandidatePins(): string[] {
  if (typeof window === "undefined") return [CANDIDATE_DASHBOARD];
  try {
    const raw = window.localStorage.getItem(CANDIDATE_PIN_KEY);
    if (!raw) return [CANDIDATE_DASHBOARD];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [CANDIDATE_DASHBOARD];
    const hrefs = parsed.filter((v): v is string => typeof v === "string");
    return hrefs.length > 0 ? hrefs : [CANDIDATE_DASHBOARD];
  } catch {
    return [CANDIDATE_DASHBOARD];
  }
}

function orderCandidateNav(items: NavItem[], pinnedHrefs: string[]) {
  const byHref = new Map(items.map((item) => [item.href, item]));
  const pinnedSet = new Set(pinnedHrefs);

  const pinned: NavItem[] = [];
  // Keep Dashboard first among pins when it is pinned.
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

function NavLink({
  item,
  pinned,
  showPinControls,
  onTogglePin,
}: {
  item: NavItem;
  pinned?: boolean;
  showPinControls?: boolean;
  onTogglePin?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = ICONS[item.icon];

  return (
    <div
      className={`group flex items-center gap-1 rounded-md ${
        active ? "bg-[var(--cf-accent)]/15" : "hover:bg-white/5"
      }`}
    >
      <Link
        href={item.href}
        className={`flex min-w-0 flex-1 items-center gap-3 px-3 py-2 text-sm font-medium transition ${
          active ? "text-white" : "text-white/70 group-hover:text-white"
        }`}
      >
        <Icon className="h-4 w-4 shrink-0" aria-hidden />
        <span className="truncate">{item.label}</span>
      </Link>
      {showPinControls && onTogglePin ? (
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

export function Sidebar({ role }: { role: UserRole }) {
  const items = getNavForRole(role);
  const isCandidate = role === "candidate";
  const [pinnedHrefs, setPinnedHrefs] = useState<string[]>([
    CANDIDATE_DASHBOARD,
  ]);
  const [ready, setReady] = useState(!isCandidate);

  useEffect(() => {
    if (!isCandidate) return;
    setPinnedHrefs(readCandidatePins());
    setReady(true);
  }, [isCandidate]);

  useEffect(() => {
    if (!isCandidate || !ready) return;
    window.localStorage.setItem(CANDIDATE_PIN_KEY, JSON.stringify(pinnedHrefs));
  }, [isCandidate, pinnedHrefs, ready]);

  const { pinned, unpinned } = useMemo(() => {
    if (!isCandidate) {
      return { pinned: items, unpinned: [] as NavItem[] };
    }
    return orderCandidateNav(items, pinnedHrefs);
  }, [isCandidate, items, pinnedHrefs]);

  function togglePin(href: string) {
    setPinnedHrefs((prev) => {
      if (prev.includes(href)) {
        return prev.filter((h) => h !== href);
      }
      // New pins append; Dashboard is reordered to front on render.
      return [...prev, href];
    });
  }

  return (
    <aside className="flex w-60 shrink-0 flex-col bg-[var(--cf-navy)] text-white">
      <div className="border-b border-white/10 px-5 py-5">
        <p className="text-xs font-semibold tracking-[0.16em] text-[var(--cf-accent)] uppercase">
          ContractFlow
        </p>
        <p className="mt-1 text-sm text-white/60">{ROLE_LABELS[role]} portal</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {isCandidate ? (
          <>
            {pinned.length > 0 ? (
              <div className="mb-1">
                <p className="px-3 pb-1 text-[10px] font-semibold tracking-[0.14em] text-white/35 uppercase">
                  Pinned
                </p>
                <div className="flex flex-col gap-0.5">
                  {pinned.map((item) => (
                    <NavLink
                      key={item.href}
                      item={item}
                      pinned
                      showPinControls
                      onTogglePin={() => togglePin(item.href)}
                    />
                  ))}
                </div>
              </div>
            ) : null}
            {unpinned.length > 0 ? (
              <div className={pinned.length > 0 ? "mt-2" : undefined}>
                {pinned.length > 0 ? (
                  <p className="px-3 pb-1 text-[10px] font-semibold tracking-[0.14em] text-white/35 uppercase">
                    More
                  </p>
                ) : null}
                <div className="flex flex-col gap-0.5">
                  {unpinned.map((item) => (
                    <NavLink
                      key={item.href}
                      item={item}
                      showPinControls
                      onTogglePin={() => togglePin(item.href)}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </>
        ) : (
          items.map((item) => <NavLink key={item.href} item={item} />)
        )}
      </nav>
      <div className="border-t border-white/10 px-4 py-3 text-xs text-white/40">
        {isCandidate
          ? "Hover a tab to pin or unpin"
          : "ACCY 628 · Group 12"}
      </div>
    </aside>
  );
}
