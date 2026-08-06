"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname } from "next/navigation";

type ShellContextValue = {
  pinned: boolean;
  mobileOpen: boolean;
  setPinned: (value: boolean) => void;
  togglePinned: () => void;
  setMobileOpen: (value: boolean) => void;
  toggleMobileOpen: () => void;
};

const ShellContext = createContext<ShellContextValue | null>(null);
const PINNED_KEY = "cf-sidebar-pinned";
const LEGACY_COLLAPSED_KEY = "cf-sidebar-collapsed";
const LEGACY_RECRUITER_SIDEBAR_PIN_KEY = "cf-recruiter-sidebar-pinned";
/** One-time migration: candidate sidebar stays open by default (no auto-collapse off Home). */
const CANDIDATE_OPEN_DEFAULT_KEY = "cf-candidate-sidebar-open-default-v1";

export function ShellProvider({ children }: { children: React.ReactNode }) {
  const [pinned, setPinnedState] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_COLLAPSED_KEY);
      localStorage.removeItem(LEGACY_RECRUITER_SIDEBAR_PIN_KEY);
      const savedPinned = localStorage.getItem(PINNED_KEY);
      if (savedPinned === "1") setPinnedState(true);
    } catch {
      /* ignore */
    }
  }, []);

  const setPinned = useCallback((value: boolean) => {
    setPinnedState(value);
    try {
      localStorage.setItem(PINNED_KEY, value ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  const togglePinned = useCallback(() => {
    setPinnedState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(PINNED_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const toggleMobileOpen = useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  const value = useMemo(
    () => ({
      pinned,
      mobileOpen,
      setPinned,
      togglePinned,
      setMobileOpen,
      toggleMobileOpen,
    }),
    [pinned, mobileOpen, setPinned, togglePinned, toggleMobileOpen],
  );

  return (
    <ShellContext.Provider value={value}>{children}</ShellContext.Provider>
  );
}

export function useShell() {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error("useShell must be used within ShellProvider");
  return ctx;
}

/** Sidebar open/collapsed layout. Candidate stays open on all pages unless toggled. */
export function useSidebarLayout(
  homePath: string,
  options?: { stayOpenEverywhere?: boolean },
) {
  const pathname = usePathname();
  const shell = useShell();
  const isHome = pathname === homePath;
  const stayOpenEverywhere = options?.stayOpenEverywhere === true;

  // Candidate: open on all pages by default (migrate once away from old auto-collapse).
  useEffect(() => {
    if (!stayOpenEverywhere) return;
    try {
      if (localStorage.getItem(CANDIDATE_OPEN_DEFAULT_KEY) !== "1") {
        localStorage.setItem(CANDIDATE_OPEN_DEFAULT_KEY, "1");
        shell.setPinned(true);
      }
    } catch {
      /* ignore */
    }
  }, [stayOpenEverywhere, shell.setPinned]);

  const forcedOpen = stayOpenEverywhere
    ? shell.pinned
    : isHome || shell.pinned;
  const showCollapsed = !forcedOpen;

  return {
    ...shell,
    isHome,
    forcedOpen,
    showCollapsed,
    /** Pin/unpin available everywhere for stay-open mode; otherwise home is locked open. */
    canTogglePin: stayOpenEverywhere ? true : !isHome || shell.pinned,
  };
}
