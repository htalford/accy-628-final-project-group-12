import type { UserRole } from "@/lib/types/database";

export const USER_ROLES: UserRole[] = [
  "employer",
  "candidate",
  "recruiter",
  "accounting",
];

export const STAFF_ROLES: UserRole[] = ["recruiter", "accounting"];
export const STAFF_EMAIL_DOMAIN = "talentquest.com";

export function isStaffRole(role: UserRole): boolean {
  return STAFF_ROLES.includes(role);
}

export function staffEmailFromUsername(input: string): string {
  const trimmed = input.trim().toLowerCase();
  const local = trimmed.includes("@") ? trimmed.split("@")[0]! : trimmed;
  return `${local}@${STAFF_EMAIL_DOMAIN}`;
}

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

export function isPublicPath(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/about") ||
    pathname.startsWith("/industries") ||
    pathname.startsWith("/locations") ||
    pathname.startsWith("/jobs") ||
    pathname.startsWith("/careers") ||
    pathname.startsWith("/auth/")
  );
}

export function pathRequiresAuth(pathname: string): boolean {
  if (isPublicPath(pathname)) return false;
  return (
    pathname.startsWith("/employer") ||
    pathname.startsWith("/candidate") ||
    pathname.startsWith("/recruiter") ||
    pathname.startsWith("/accounting")
  );
}

export type NavIcon =
  | "layout-dashboard"
  | "clipboard-check"
  | "briefcase"
  | "file-text"
  | "clock"
  | "wallet"
  | "receipt"
  | "file-signature"
  | "circle-dollar-sign"
  | "trending-up"
  | "bar-chart-3"
  | "messages-square"
  | "user"
  | "history";

export type NavItem = {
  href: string;
  label: string;
  icon: NavIcon;
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
        { href: "/candidate/timesheets", label: "Submit timesheet", icon: "clock" },
      ];
    case "recruiter":
      return [
        { href: "/recruiter/dashboard", label: "Dashboard", icon: "layout-dashboard" },
        { href: "/recruiter/placements", label: "Placements", icon: "briefcase" },
      ];
    case "accounting":
      return [
        { href: "/accounting/dashboard", label: "Home", icon: "layout-dashboard" },
        { href: "/accounting/invoices", label: "Invoices", icon: "file-text" },
        { href: "/accounting/payroll", label: "Payroll", icon: "wallet" },
        { href: "/accounting/accounts-receivable", label: "Accounts Receivable", icon: "receipt" },
        { href: "/accounting/contracts", label: "Contracts", icon: "file-signature" },
        { href: "/accounting/expenses", label: "Expenses", icon: "circle-dollar-sign" },
        { href: "/accounting/profitability", label: "Profitability", icon: "trending-up" },
        { href: "/accounting/reports", label: "Financial Reports", icon: "bar-chart-3" },
        { href: "/accounting/audit-trail", label: "Audit Trail", icon: "history" },
        { href: "/accounting/messages", label: "Messages", icon: "messages-square" },
        { href: "/accounting/profile", label: "Profile", icon: "user" },
      ];
  }
}

export function getPageTitle(pathname: string): string {
  const map: Record<string, string> = {
    "/accounting/dashboard": "Home",
    "/accounting/invoices": "Invoices",
    "/accounting/payroll": "Payroll",
    "/accounting/accounts-receivable": "Accounts Receivable",
    "/accounting/contracts": "Contracts",
    "/accounting/expenses": "Expenses",
    "/accounting/profitability": "Profitability",
    "/accounting/reports": "Financial Reports",
    "/accounting/audit-trail": "Audit Trail",
    "/accounting/messages": "Messages",
    "/accounting/profile": "Profile",
    "/employer/dashboard": "Dashboard",
    "/employer/timesheets": "Timesheet approval",
    "/candidate/dashboard": "Dashboard",
    "/candidate/timesheets": "Submit timesheet",
    "/recruiter/dashboard": "Dashboard",
    "/recruiter/placements": "Placements",
  };

  if (map[pathname]) return map[pathname];
  if (pathname === "/accounting/invoices/new") return "Create Invoice";
  if (pathname.startsWith("/accounting/invoices/")) return "Invoice detail";
  if (pathname.startsWith("/accounting/contracts/")) return "Contract detail";
  return "TalentQuest";
}
