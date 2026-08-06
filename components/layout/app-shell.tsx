import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { ClientPortalShell } from "@/components/client-portal/client-portal-shell";
import { FaqWidget } from "@/components/help/faq-widget";
import { ShellProvider } from "@/components/layout/shell-context";
import { loadClientPortalChrome } from "@/lib/client-portal/chrome";
import { loadCandidateNotifications } from "@/lib/candidate/notifications";
import { loadAccountingNotifications } from "@/lib/accounting/notifications";
import { loadRecruiterNotifications } from "@/lib/recruiter/notifications";
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
          attentionHrefs={chrome.navAttentionHrefs}
        >
          {children}
        </ClientPortalShell>
        <FaqWidget role={user.role} />
      </>
    );
  }

  const [candidateChrome, accountingChrome, recruiterChrome] =
    await Promise.all([
      user.role === "candidate" ? loadCandidateNotifications() : null,
      user.role === "accounting" ? loadAccountingNotifications() : null,
      user.role === "recruiter" ? loadRecruiterNotifications() : null,
    ]);

  const attentionHrefs =
    candidateChrome?.navAttentionHrefs ??
    accountingChrome?.navAttentionHrefs ??
    recruiterChrome?.navAttentionHrefs ??
    [];

  const unreadMessageCount =
    candidateChrome?.unreadMessageCount ??
    recruiterChrome?.unreadMessageCount ??
    0;

  return (
    <ShellProvider>
      <div className="flex min-h-full flex-1">
        <Sidebar
          role={user.role}
          unreadMessageCount={unreadMessageCount}
          attentionHrefs={attentionHrefs}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar
            user={user}
            notifications={
              candidateChrome?.notifications ??
              accountingChrome?.notifications ??
              recruiterChrome?.notifications ??
              undefined
            }
          />
          <main className="flex-1 bg-[var(--cf-surface)] p-4 sm:p-6">
            {children}
          </main>
        </div>
      </div>
      <FaqWidget role={user.role} />
    </ShellProvider>
  );
}
