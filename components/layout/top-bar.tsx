"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  User,
} from "lucide-react";
import { signOut } from "@/app/actions/demo-switch-role";
import { getDashboardPath, getPageTitle, ROLE_LABELS } from "@/lib/auth/roles";
import { SAMPLE_NOTIFICATIONS } from "@/lib/accounting/notifications";
import { useShell } from "@/components/layout/shell-context";
import type { AppUser } from "@/lib/types/database";
import { searchAccounting } from "@/app/actions/accounting-search";

type SearchHit = {
  type: string;
  id: string;
  label: string;
  href: string;
};

export function TopBar({ user }: { user: AppUser }) {
  const pathname = usePathname();
  const { collapsed, toggleCollapsed, toggleMobileOpen } = useShell();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!searchRef.current?.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setHits([]);
      return;
    }
    const handle = setTimeout(() => {
      startTransition(async () => {
        const results = await searchAccounting(query.trim());
        setHits(results);
        setSearchOpen(true);
      });
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  const profileHref = useMemo(() => {
    if (user.role === "accounting") return "/accounting/profile";
    return getPageTitle(pathname) ? "#" : "#";
  }, [user.role, pathname]);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-[var(--cf-border)] bg-white px-3 sm:px-6">
      <button
        type="button"
        className="rounded-md border border-[var(--cf-border)] p-2 text-[var(--cf-ink)] hover:bg-[var(--cf-surface)] lg:hidden"
        onClick={toggleMobileOpen}
        aria-label="Open menu"
      >
        <Menu className="h-4 w-4" />
      </button>
      <button
        type="button"
        className="hidden rounded-md border border-[var(--cf-border)] p-2 text-[var(--cf-ink)] hover:bg-[var(--cf-surface)] lg:inline-flex"
        onClick={toggleCollapsed}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <PanelLeftOpen className="h-4 w-4" />
        ) : (
          <PanelLeftClose className="h-4 w-4" />
        )}
      </button>

      <Link
        href={getDashboardPath(user.role)}
        className="flex min-w-0 shrink-0 items-center"
        title="TalentQuest"
      >
        <Image
          src="/talentquest-logo.png"
          alt="TalentQuest"
          width={168}
          height={118}
          className="h-8 w-auto"
          priority
        />
      </Link>

      <div className="relative ml-auto min-w-0 flex-1 max-w-md" ref={searchRef}>
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--cf-muted)]" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => hits.length > 0 && setSearchOpen(true)}
          placeholder="Search clients, invoices, contracts…"
          className="w-full rounded-md border border-[var(--cf-border)] bg-[var(--cf-surface)] py-2 pr-3 pl-9 text-sm outline-none ring-[var(--cf-accent)] focus:bg-white focus:ring-2"
        />
        {searchOpen && (hits.length > 0 || pending) ? (
          <div className="absolute top-full right-0 left-0 z-50 mt-1 max-h-72 overflow-auto rounded-lg border border-[var(--cf-border)] bg-white shadow-lg">
            {pending && hits.length === 0 ? (
              <p className="px-3 py-2 text-xs text-[var(--cf-muted)]">
                Searching…
              </p>
            ) : null}
            {hits.map((hit) => (
              <Link
                key={`${hit.type}-${hit.id}`}
                href={hit.href}
                onClick={() => {
                  setSearchOpen(false);
                  setQuery("");
                }}
                className="block border-b border-[var(--cf-border)] px-3 py-2 last:border-0 hover:bg-[var(--cf-surface)]"
              >
                <p className="text-xs font-medium tracking-wide text-[var(--cf-muted)] uppercase">
                  {hit.type}
                </p>
                <p className="text-sm text-[var(--cf-ink)]">{hit.label}</p>
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      <div className="relative">
        <button
          type="button"
          className="rounded-md border border-[var(--cf-border)] p-2 text-[var(--cf-ink)] hover:bg-[var(--cf-surface)]"
          onClick={() => {
            setNotifOpen((v) => !v);
            setProfileOpen(false);
          }}
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </button>
        {notifOpen ? (
          <div className="absolute top-full right-0 z-50 mt-1 w-80 rounded-lg border border-[var(--cf-border)] bg-white shadow-lg">
            <p className="border-b border-[var(--cf-border)] px-3 py-2 text-xs font-semibold tracking-wide text-[var(--cf-muted)] uppercase">
              Notifications
            </p>
            <ul className="max-h-80 overflow-auto">
              {SAMPLE_NOTIFICATIONS.map((n) => (
                <li
                  key={n.id}
                  className="border-b border-[var(--cf-border)] px-3 py-2 last:border-0"
                >
                  <p className="text-sm font-medium text-[var(--cf-ink)]">
                    {n.title}
                  </p>
                  <p className="text-xs text-[var(--cf-muted)]">{n.body}</p>
                  <p className="mt-1 text-[11px] text-[var(--cf-muted)]">
                    {n.createdAt}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="relative">
        <button
          type="button"
          className="flex max-w-[12rem] items-center gap-2 rounded-md border border-[var(--cf-border)] px-2 py-1.5 text-left hover:bg-[var(--cf-surface)] sm:max-w-none sm:px-3"
          onClick={() => {
            setProfileOpen((v) => !v);
            setNotifOpen(false);
          }}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--cf-navy)] text-xs font-semibold text-white">
            {user.name
              .split(" ")
              .map((p) => p[0])
              .join("")
              .slice(0, 2)}
          </span>
          <span className="hidden min-w-0 sm:block">
            <span className="block truncate text-sm font-medium text-[var(--cf-ink)]">
              {user.name}
            </span>
            <span className="block truncate text-xs text-[var(--cf-muted)]">
              {ROLE_LABELS[user.role]}
            </span>
          </span>
          <ChevronDown className="hidden h-4 w-4 text-[var(--cf-muted)] sm:block" />
        </button>
        {profileOpen ? (
          <div className="absolute top-full right-0 z-50 mt-1 w-56 rounded-lg border border-[var(--cf-border)] bg-white py-1 shadow-lg">
            <div className="border-b border-[var(--cf-border)] px-3 py-2">
              <p className="text-sm font-medium text-[var(--cf-ink)]">
                {user.name}
              </p>
              <p className="truncate text-xs text-[var(--cf-muted)]">
                {user.email}
              </p>
            </div>
            {user.role === "accounting" ? (
              <Link
                href={profileHref}
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--cf-ink)] hover:bg-[var(--cf-surface)]"
              >
                <User className="h-4 w-4" />
                Profile
              </Link>
            ) : null}
            <form action={signOut}>
              <button
                type="submit"
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--cf-ink)] hover:bg-[var(--cf-surface)]"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </header>
  );
}
