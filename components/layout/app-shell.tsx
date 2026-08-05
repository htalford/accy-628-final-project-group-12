import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { RoleSwitcher } from "@/components/demo/role-switcher";
import { ShellProvider } from "@/components/layout/shell-context";
import type { AppUser } from "@/lib/types/database";

export function AppShell({
  user,
  children,
}: {
  user: AppUser;
  children: React.ReactNode;
}) {
  return (
    <ShellProvider>
      <div className="flex min-h-full flex-1">
        <Sidebar role={user.role} />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar user={user} />
          <main className="flex-1 bg-[var(--cf-surface)] p-4 sm:p-6">
            {children}
          </main>
        </div>
        <RoleSwitcher currentRole={user.role} />
      </div>
    </ShellProvider>
  );
}
