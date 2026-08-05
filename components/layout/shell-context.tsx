"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type ShellContextValue = {
  collapsed: boolean;
  mobileOpen: boolean;
  setCollapsed: (value: boolean) => void;
  toggleCollapsed: () => void;
  setMobileOpen: (value: boolean) => void;
  toggleMobileOpen: () => void;
};

const ShellContext = createContext<ShellContextValue | null>(null);
const STORAGE_KEY = "cf-sidebar-collapsed";
const LEGACY_SIDEBAR_PIN_KEY = "cf-recruiter-sidebar-pinned";

export function ShellProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsedState] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      // Remove obsolete whole-sidebar pin preference.
      localStorage.removeItem(LEGACY_SIDEBAR_PIN_KEY);
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "1") setCollapsedState(true);
    } catch {
      /* ignore */
    }
  }, []);

  const setCollapsed = useCallback((value: boolean) => {
    setCollapsedState(value);
    try {
      localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsedState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
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
      collapsed,
      mobileOpen,
      setCollapsed,
      toggleCollapsed,
      setMobileOpen,
      toggleMobileOpen,
    }),
    [collapsed, mobileOpen, setCollapsed, toggleCollapsed, toggleMobileOpen],
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
