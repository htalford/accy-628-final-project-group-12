import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { ClientPortalShell } from "@/components/client-portal/client-portal-shell";
import { RoleSwitcher } from "@/components/demo/role-switcher";
import { FaqWidget } from "@/components/help/faq-widget";
import { ShellProvider } from "@/components/layout/shell-context";
import { loadClientPortalChrome } from "@/lib/client-portal/chrome";
import { loadCandidateNotifications } from "@/lib/candidate/notifications";
import type { AppUser } from "@/lib/types/database";

export async function AppShell({
  user,
  children,
}: {
  user: AppUser;
  children: React.ReactNode;
}) {
  if (user.role === "employer") {
    const chrome = await loadClientPortalChrome();
    return (
      <>
        <ClientPortalShell
          user={user}
          notifications={chrome.notifications}
          searchIndex={chrome.searchIndex}
        >
          {children}
        </ClientPortalShell>
        <FaqWidget role={user.role} />
        <RoleSwitcher currentRole={user.role} />
      </>
    );
  }

  const candidateChrome =
    user.role === "candidate" ? await loadCandidateNotifications() : null;

  return (
    <ShellProvider>
      <div className="flex min-h-full flex-1">
        <Sidebar
          role={user.role}
          unreadMessageCount={candidateChrome?.unreadMessageCount ?? 0}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar
            user={user}
            notifications={candidateChrome?.notifications}
          />
          <main className="flex-1 bg-[var(--cf-surface)] p-4 sm:p-6">
            {children}
          </main>
        </div>
      </div>
      <FaqWidget role={user.role} />
      {user.role !== "candidate" ? (
        <RoleSwitcher currentRole={user.role} />
      ) : null}
    </ShellProvider>
  );
}
