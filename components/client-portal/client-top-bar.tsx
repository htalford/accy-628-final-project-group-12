"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Bell,
  ChevronDown,
  LogOut,
  Search,
  UserRound,
} from "lucide-react";
import { signOut } from "@/app/actions/demo-switch-role";
import { ROLE_LABELS } from "@/lib/auth/roles";
import {
  filterSearchIndex,
  type ClientNotification,
  type ClientSearchHit,
} from "@/lib/client-portal/chrome-shared";
import type { AppUser } from "@/lib/types/database";
import { MobileMenuButton } from "@/components/client-portal/client-sidebar";
import { SearchInput } from "@/components/ui/search-input";

function pageTitleFromPath(pathname: string): string {
  if (pathname.startsWith("/client/job-requests/new")) return "New Job Request";
  if (pathname.startsWith("/client/job-requests/")) return "Job Request";
  if (pathname.startsWith("/client/job-requests")) return "Job Requests";
  if (pathname.startsWith("/client/candidates/")) return "Candidate Profile";
  if (pathname.startsWith("/client/candidates")) return "Candidates";
  if (pathname.startsWith("/client/employees/")) return "Employee";
  if (pathname.startsWith("/client/employees")) return "Employees";
  if (pathname.startsWith("/client/contracts/")) return "Contract";
  if (pathname.startsWith("/client/contracts")) return "Contracts";
  if (pathname.startsWith("/client/timesheets/")) return "Timesheet";
  if (pathname.startsWith("/client/timesheets")) return "Timesheets";
  if (pathname.startsWith("/client/invoices/")) return "Invoice";
  if (pathname.startsWith("/client/invoices")) return "Invoices";
  if (pathname.startsWith("/client/messages")) return "Messages";
  if (pathname.startsWith("/client/profile")) return "Profile";
  if (pathname.startsWith("/client/dashboard")) return "Dashboard";
  return "Client Portal";
}

function SearchHitLink({
  item,
  onSelect,
  showCategory,
}: {
  item: ClientSearchHit;
  onSelect: () => void;
  showCategory?: boolean;
}) {
  return (
    <Link
      href={item.href}
      onClick={onSelect}
      className="block rounded-lg px-2 py-2 hover:bg-[var(--cf-surface)]"
    >
      <p className="text-sm font-medium text-[var(--cf-ink)]">{item.label}</p>
      <p className="text-xs text-[var(--cf-muted)]">
        {showCategory
          ? `${item.category} · ${item.sublabel}`
          : item.sublabel}
      </p>
    </Link>
  );
}

function DesktopSearchResults({
  query,
  hits,
  grouped,
  onSelect,
}: {
  query: string;
  hits: ClientSearchHit[];
  grouped: Map<ClientSearchHit["category"], ClientSearchHit[]>;
  onSelect: () => void;
}) {
  if (hits.length === 0) {
    return (
      <p className="px-4 py-3 text-sm text-[var(--cf-muted)]">
        No results for &ldquo;{query}&rdquo;.
      </p>
    );
  }

  return (
    <>
      {[...grouped.entries()].map(([category, items]) => (
        <div key={category} className="px-2 py-1">
          <p className="px-2 py-1 text-[10px] font-semibold tracking-wide text-[var(--cf-muted)] uppercase">
            {category}
          </p>
          {items.map((item) => (
            <SearchHitLink key={item.id} item={item} onSelect={onSelect} />
          ))}
        </div>
      ))}
    </>
  );
}

function MobileSearchResults({
  hits,
  onSelect,
}: {
  hits: ClientSearchHit[];
  onSelect: () => void;
}) {
  if (hits.length === 0) {
    return (
      <p className="px-1 py-2 text-sm text-[var(--cf-muted)]">No results</p>
    );
  }

  return (
    <>
      {hits.map((item) => (
        <SearchHitLink
          key={item.id}
          item={item}
          onSelect={onSelect}
          showCategory
        />
      ))}
    </>
  );
}

export function ClientTopBar({
  user,
  notifications,
  searchIndex,
  onOpenMobileMenu,
}: {
  user: AppUser;
  notifications: ClientNotification[];
  searchIndex: ClientSearchHit[];
  onOpenMobileMenu: () => void;
}) {
  const pathname = usePathname();
  const title = useMemo(() => pageTitleFromPath(pathname), [pathname]);

  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const hits = useMemo(
    () => filterSearchIndex(searchIndex, query),
    [searchIndex, query],
  );
  const grouped = useMemo(() => {
    const map = new Map<ClientSearchHit["category"], ClientSearchHit[]>();
    for (const hit of hits) {
      const list = map.get(hit.category) ?? [];
      list.push(hit);
      map.set(hit.category, list);
    }
    return map;
  }, [hits]);

  const actionableCount = notifications.filter((n) => n.id !== "all-clear").length;

  function clearSearch() {
    setSearchOpen(false);
    setQuery("");
  }

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node;
      if (searchRef.current && !searchRef.current.contains(t)) {
        setSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(t)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(t)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <header
      data-client-top-bar
      className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[var(--cf-border)] bg-white/95 px-4 backdrop-blur sm:px-6 print:hidden"
    >
      <MobileMenuButton onClick={onOpenMobileMenu} />

      <div className="flex min-w-0 items-center gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--cf-ink)]">
            {title}
          </p>
          <p className="hidden truncate text-xs text-[var(--cf-muted)] sm:block">
            TalentQuest · Client Portal
          </p>
        </div>
      </div>

      <div
        className="relative mx-auto hidden max-w-md flex-1 md:block"
        ref={searchRef}
      >
        <SearchInput
          placeholder="Search employees, candidates, jobs…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSearchOpen(true);
          }}
          onFocus={() => setSearchOpen(true)}
          aria-label="Global search"
        />
        {searchOpen && query.trim() ? (
          <div className="absolute top-full z-40 mt-1 max-h-80 w-full overflow-y-auto rounded-xl border border-[var(--cf-border)] bg-white py-2 shadow-lg">
            <DesktopSearchResults
              query={query}
              hits={hits}
              grouped={grouped}
              onSelect={clearSearch}
            />
          </div>
        ) : null}
      </div>

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <button
          type="button"
          className="inline-flex rounded-lg border border-[var(--cf-border)] p-2 text-[var(--cf-muted)] md:hidden"
          aria-label="Search"
          onClick={() => setSearchOpen((v) => !v)}
        >
          <Search className="h-4 w-4" />
        </button>

        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => {
              setNotifOpen((v) => !v);
              setProfileOpen(false);
            }}
            className="relative rounded-lg border border-[var(--cf-border)] p-2 text-[var(--cf-muted)] hover:bg-[var(--cf-surface)]"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {actionableCount > 0 ? (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[var(--cf-accent)]" />
            ) : null}
          </button>
          {notifOpen ? (
            <div className="absolute top-full right-0 z-40 mt-1 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-[var(--cf-border)] bg-white py-2 shadow-lg">
              <p className="border-b border-[var(--cf-border)] px-4 py-2 text-xs font-semibold tracking-wide text-[var(--cf-muted)] uppercase">
                Notifications
              </p>
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((n) => (
                  <Link
                    key={n.id}
                    href={n.href}
                    onClick={() => setNotifOpen(false)}
                    className="block px-4 py-3 hover:bg-[var(--cf-surface)]"
                  >
                    <p className="text-sm font-medium text-[var(--cf-ink)]">
                      {n.title}
                    </p>
                    <p className="text-xs text-[var(--cf-muted)]">{n.detail}</p>
                    <p className="mt-0.5 text-[10px] text-[var(--cf-muted)]">
                      {n.time}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => {
              setProfileOpen((v) => !v);
              setNotifOpen(false);
            }}
            className="flex items-center gap-2 rounded-lg border border-[var(--cf-border)] py-1.5 pr-2 pl-1.5 hover:bg-[var(--cf-surface)]"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--cf-navy)] text-xs font-semibold text-white">
              {user.name
                .split(" ")
                .map((p) => p[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-xs font-medium text-[var(--cf-ink)]">
                {user.name}
              </span>
              <span className="block text-[10px] text-[var(--cf-muted)]">
                {ROLE_LABELS[user.role]}
              </span>
            </span>
            <ChevronDown className="hidden h-3.5 w-3.5 text-[var(--cf-muted)] sm:block" />
          </button>
          {profileOpen ? (
            <div className="absolute top-full right-0 z-40 mt-1 w-56 rounded-xl border border-[var(--cf-border)] bg-white py-1 shadow-lg">
              <div className="border-b border-[var(--cf-border)] px-3 py-2">
                <p className="text-sm font-medium text-[var(--cf-ink)]">
                  {user.name}
                </p>
                <p className="truncate text-xs text-[var(--cf-muted)]">
                  {user.email}
                </p>
              </div>
              <Link
                href="/client/profile"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--cf-ink)] hover:bg-[var(--cf-surface)]"
              >
                <UserRound className="h-4 w-4" />
                View profile
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--cf-ink)] hover:bg-[var(--cf-surface)]"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </div>

      {searchOpen ? (
        <div
          className="absolute top-16 right-4 left-4 z-40 md:hidden"
          ref={searchRef}
        >
          <div className="rounded-xl border border-[var(--cf-border)] bg-white p-3 shadow-lg">
            <SearchInput
              autoFocus
              placeholder="Search portal…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query.trim() ? (
              <div className="mt-2 max-h-60 overflow-y-auto">
                <MobileSearchResults hits={hits} onSelect={clearSearch} />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}
