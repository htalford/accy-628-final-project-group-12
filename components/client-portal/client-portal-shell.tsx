"use client";

import { useEffect, useState } from "react";
import {
  ClientSidebar,
  readClientIconsOnly,
  writeClientIconsOnly,
} from "@/components/client-portal/client-sidebar";
import { ClientTopBar } from "@/components/client-portal/client-top-bar";
import { ToastProvider } from "@/components/client-portal/toast";
import type {
  ClientNotification,
  ClientSearchHit,
} from "@/lib/client-portal/chrome-shared";
import type { AppUser } from "@/lib/types/database";

export function ClientPortalShell({
  user,
  notifications = [],
  searchIndex = [],
  attentionHrefs = [],
  children,
}: {
  user: AppUser;
  notifications?: ClientNotification[];
  searchIndex?: ClientSearchHit[];
  attentionHrefs?: string[];
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setCollapsed(readClientIconsOnly());
    setReady(true);
  }, []);

  function toggleIconsOnly() {
    setCollapsed((c) => {
      const next = !c;
      writeClientIconsOnly(next);
      return next;
    });
  }

  return (
    <ToastProvider>
      <div className="flex min-h-full flex-1">
        {ready ? (
          <ClientSidebar
            collapsed={collapsed}
            onToggleCollapse={toggleIconsOnly}
            mobileOpen={mobileOpen}
            onMobileClose={() => setMobileOpen(false)}
            attentionHrefs={attentionHrefs}
          />
        ) : (
          <div
            className="hidden w-64 shrink-0 bg-[var(--cf-navy)] lg:block"
            aria-hidden
          />
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          <ClientTopBar
            user={user}
            notifications={notifications}
            searchIndex={searchIndex}
            onOpenMobileMenu={() => setMobileOpen(true)}
          />
          <main className="flex-1 bg-[var(--cf-surface)] p-4 sm:p-6">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
