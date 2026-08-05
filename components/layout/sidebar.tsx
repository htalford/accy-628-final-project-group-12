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
import { usePinnedTasks } from "@/components/portal-pins/use-pinned-tasks";
import type { PinnedTask } from "@/lib/portal-pins";

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

function AccountingPinnedTaskLink({
  task,
  collapsed,
  onNavigate,
  onUnpin,
}: {
  task: PinnedTask;
  collapsed: boolean;
  onNavigate?: () => void;
  onUnpin: () => void;
}) {
  const pathname = usePathname();
  const active =
    pathname === task.href || pathname.startsWith(`${task.href}/`);

  return (
    <div
      className={`group flex items-center gap-0.5 rounded-md ${
        active ? "bg-[var(--cf-accent)]/15" : "hover:bg-white/5"
      }`}
    >
      <Link
        href={task.href}
        title={task.sublabel ? `${task.label} · ${task.sublabel}` : task.label}
        onClick={onNavigate}
        className={`flex min-w-0 flex-1 items-center gap-3 px-3 py-2 text-sm font-medium transition ${
          collapsed ? "justify-center px-2" : ""
        } ${active ? "text-white" : "text-white/70 group-hover:text-white"}`}
      >
        <Pin className="h-3.5 w-3.5 shrink-0 fill-current text-[var(--cf-accent)]" />
        {!collapsed ? (
          <span className="min-w-0">
            <span className="block truncate">{task.label}</span>
            {task.sublabel ? (
              <span className="block truncate text-[10px] font-normal text-white/40">
                {task.sublabel}
              </span>
            ) : null}
          </span>
        ) : null}
      </Link>
      {!collapsed ? (
        <button
          type="button"
          onClick={onUnpin}
          title={`Unpin ${task.label}`}
          aria-label={`Unpin ${task.label}`}
          className="mr-1 rounded p-1.5 text-white/35 opacity-0 transition group-hover:opacity-100 hover:text-white"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

export function Sidebar({ role }: { role: UserRole }) {
  const items = getNavForRole(role);
  const isCandidate = role === "candidate";
  const isAccounting = role === "accounting";
  const { collapsed, mobileOpen, setMobileOpen } = useShell();
  const [pinnedHrefs, setPinnedHrefs] = useState<string[]>([
    CANDIDATE_DASHBOARD,
  ]);
  const [ready, setReady] = useState(!isCandidate);
  const { tasks: accountingPins, unpin: unpinAccounting } =
    usePinnedTasks("accounting");

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
      return [...prev, href];
    });
  }

  const showCollapsed = collapsed && !mobileOpen;

  const accountingPinnedSection =
    isAccounting && accountingPins.length > 0 ? (
      <div className="mb-2">
        {!showCollapsed ? (
          <p className="px-3 pb-1 text-[10px] font-semibold tracking-[0.14em] text-white/35 uppercase">
            Pinned tasks
          </p>
        ) : null}
        <div className="flex flex-col gap-0.5">
          {accountingPins.map((task) => (
            <AccountingPinnedTaskLink
              key={task.id}
              task={task}
              collapsed={showCollapsed}
              onNavigate={() => setMobileOpen(false)}
              onUnpin={() => unpinAccounting(task.id)}
            />
          ))}
        </div>
      </div>
    ) : null;

  const nav = (
    <>
      <div
        className={`relative border-b border-white/10 ${showCollapsed ? "px-2 py-3" : "px-4 py-4"}`}
      >
        <button
          type="button"
          className="absolute top-3 right-3 rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex w-full flex-col items-center text-center">
          <Link
            href={getDashboardPath(role)}
            className={`inline-flex rounded-md bg-white ${showCollapsed ? "p-1.5" : "p-2"}`}
            title="TalentQuest"
          >
            <Image
              src="/talentquest-logo.png"
              alt="TalentQuest"
              width={168}
              height={118}
              className={`mx-auto w-auto ${showCollapsed ? "h-8" : "h-11"}`}
              priority
            />
          </Link>
          {!showCollapsed ? (
            <p className="mt-2 text-sm text-white/60">
              {ROLE_LABELS[role]} Portal
            </p>
          ) : null}
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {accountingPinnedSection}
        {isCandidate ? (
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
          <>
            {isAccounting && accountingPins.length > 0 && !showCollapsed ? (
              <p className="px-3 pb-1 text-[10px] font-semibold tracking-[0.14em] text-white/35 uppercase">
                Menu
              </p>
            ) : null}
            {items.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                collapsed={showCollapsed}
                onNavigate={() => setMobileOpen(false)}
              />
            ))}
          </>
        )}
      </nav>
      {!showCollapsed ? (
        <div className="border-t border-white/10 px-4 py-3 text-xs text-white/40">
          {isCandidate
            ? "Hover a tab to pin or unpin"
            : isAccounting
              ? "Pin contracts from the Contracts page"
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
