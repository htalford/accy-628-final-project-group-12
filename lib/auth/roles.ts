import type { UserRole } from "@/lib/types/database";

export const USER_ROLES: UserRole[] = [
  "client",
  "employee",
  "manager",
  "accounting",
];

export const ROLE_LABELS: Record<UserRole, string> = {
  client: "Client",
  employee: "Employee",
  manager: "Manager",
  accounting: "Accounting",
};

export const DEMO_ACCOUNTS: Record<
  UserRole,
  { email: string; label: string }
> = {
  client: { email: "client@contractflow.demo", label: "Casey Client" },
  employee: { email: "employee@contractflow.demo", label: "Jordan Lee" },
  manager: { email: "manager@contractflow.demo", label: "Morgan Manager" },
  accounting: {
    email: "accounting@contractflow.demo",
    label: "Avery Accounting",
  },
};

export function getDashboardPath(role: UserRole): string {
  switch (role) {
    case "client":
      return "/client/dashboard";
    case "employee":
      return "/employee/dashboard";
    case "manager":
      return "/manager/dashboard";
    case "accounting":
      return "/accounting/dashboard";
  }
}

export function getRoleHomePrefix(role: UserRole): string {
  return `/${role}`;
}

export function isRolePath(pathname: string, role: UserRole): boolean {
  return (
    pathname === `/${role}` || pathname.startsWith(`/${role}/`)
  );
}

export function isPublicPath(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/about") ||
    pathname.startsWith("/industries") ||
    pathname.startsWith("/careers") ||
    pathname.startsWith("/auth/")
  );
}

export function pathRequiresAuth(pathname: string): boolean {
  if (isPublicPath(pathname)) return false;
  return (
    pathname.startsWith("/client") ||
    pathname.startsWith("/employee") ||
    pathname.startsWith("/manager") ||
    pathname.startsWith("/accounting")
  );
}

export type NavItem = {
  href: string;
  label: string;
  icon: "layout-dashboard" | "clipboard-check" | "briefcase" | "file-text" | "clock";
};

export function getNavForRole(role: UserRole): NavItem[] {
  switch (role) {
    case "client":
      return [
        { href: "/client/dashboard", label: "Dashboard", icon: "layout-dashboard" },
        { href: "/client/timesheets", label: "Timesheet approval", icon: "clipboard-check" },
      ];
    case "employee":
      return [
        { href: "/employee/dashboard", label: "Dashboard", icon: "layout-dashboard" },
        { href: "/employee/timesheets", label: "Submit timesheet", icon: "clock" },
      ];
    case "manager":
      return [
        { href: "/manager/dashboard", label: "Dashboard", icon: "layout-dashboard" },
        { href: "/manager/placements", label: "Placements", icon: "briefcase" },
      ];
    case "accounting":
      return [
        { href: "/accounting/dashboard", label: "Dashboard", icon: "layout-dashboard" },
        { href: "/accounting/invoices", label: "Invoices", icon: "file-text" },
      ];
  }
}
