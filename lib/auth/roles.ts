import type { UserRole } from "@/lib/types/database";

export const USER_ROLES: UserRole[] = [
  "employer",
  "candidate",
  "recruiter",
  "accounting",
];

export const ROLE_LABELS: Record<UserRole, string> = {
  employer: "Employer",
  candidate: "Candidate",
  recruiter: "Recruiter",
  accounting: "Accounting",
};

export const DEMO_ACCOUNTS: Record<
  UserRole,
  { email: string; label: string }
> = {
  employer: { email: "employer@contractflow.demo", label: "Casey Employer" },
  candidate: { email: "candidate@contractflow.demo", label: "Jordan Lee" },
  recruiter: { email: "recruiter@contractflow.demo", label: "Morgan Recruiter" },
  accounting: {
    email: "accounting@contractflow.demo",
    label: "Avery Accounting",
  },
};

export function getDashboardPath(role: UserRole): string {
  switch (role) {
    case "employer":
      return "/employer/dashboard";
    case "candidate":
      return "/candidate/dashboard";
    case "recruiter":
      return "/recruiter/dashboard";
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

export function pathRequiresAuth(pathname: string): boolean {
  if (pathname === "/login") return false;
  if (pathname.startsWith("/auth/")) return false;
  return (
    pathname.startsWith("/employer") ||
    pathname.startsWith("/candidate") ||
    pathname.startsWith("/recruiter") ||
    pathname.startsWith("/accounting")
  );
}

export type NavItem = {
  href: string;
  label: string;
  icon:
    | "layout-dashboard"
    | "clipboard-check"
    | "briefcase"
    | "file-text"
    | "clock"
    | "search"
    | "file-signature"
    | "send"
    | "wallet"
    | "circle-check"
    | "message-square"
    | "user";
};

export function getNavForRole(role: UserRole): NavItem[] {
  switch (role) {
    case "employer":
      return [
        { href: "/employer/dashboard", label: "Dashboard", icon: "layout-dashboard" },
        { href: "/employer/timesheets", label: "Timesheet approval", icon: "clipboard-check" },
      ];
    case "candidate":
      return [
        { href: "/candidate/dashboard", label: "Dashboard", icon: "layout-dashboard" },
        { href: "/candidate/jobs", label: "Available jobs", icon: "search" },
        { href: "/candidate/contracts", label: "Contracts", icon: "file-signature" },
        { href: "/candidate/timesheets", label: "Timesheets", icon: "clock" },
        { href: "/candidate/applications", label: "Applications", icon: "send" },
        { href: "/candidate/pay", label: "Pay", icon: "wallet" },
        { href: "/candidate/completions", label: "Completions", icon: "circle-check" },
        { href: "/candidate/messages", label: "Messages", icon: "message-square" },
        { href: "/candidate/profile", label: "Profile", icon: "user" },
      ];
    case "recruiter":
      return [
        { href: "/recruiter/dashboard", label: "Dashboard", icon: "layout-dashboard" },
        { href: "/recruiter/placements", label: "Placements", icon: "briefcase" },
      ];
    case "accounting":
      return [
        { href: "/accounting/dashboard", label: "Dashboard", icon: "layout-dashboard" },
        { href: "/accounting/invoices", label: "Invoices", icon: "file-text" },
      ];
  }
}
