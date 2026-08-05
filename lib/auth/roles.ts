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
  employer: { email: "employer@talentquest.demo", label: "Casey Employer" },
  candidate: { email: "candidate@talentquest.demo", label: "Jordan Lee" },
  recruiter: { email: "recruiter@talentquest.demo", label: "Morgan Recruiter" },
  accounting: {
    email: "accounting@talentquest.demo",
    label: "Avery Accounting",
  },
};

export function getDashboardPath(role: UserRole): string {
  switch (role) {
    case "employer":
      return "/client/dashboard";
    case "candidate":
      return "/candidate/dashboard";
    case "recruiter":
      return "/recruiter/dashboard";
    case "accounting":
      return "/accounting/dashboard";
  }
}

/** URL prefix for a role's portal home. Employer uses /client (Client Portal). */
export function getRoleHomePrefix(role: UserRole): string {
  if (role === "employer") return "/client";
  return `/${role}`;
}

export function isRolePath(pathname: string, role: UserRole): boolean {
  const prefix = getRoleHomePrefix(role);
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** Also treats legacy /employer/* as employer territory for redirects. */
export function isEmployerPath(pathname: string): boolean {
  return (
    isRolePath(pathname, "employer") ||
    pathname === "/employer" ||
    pathname.startsWith("/employer/")
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
    pathname.startsWith("/client") ||
    pathname.startsWith("/employer") ||
    pathname.startsWith("/candidate") ||
    pathname.startsWith("/recruiter") ||
    pathname.startsWith("/accounting")
  );
}

/**
 * Resolve which portal role a pathname belongs to.
 * /client/* maps to employer (Client Portal).
 */
export function roleFromPathname(pathname: string): UserRole | null {
  if (
    pathname === "/client" ||
    pathname.startsWith("/client/") ||
    pathname === "/employer" ||
    pathname.startsWith("/employer/")
  ) {
    return "employer";
  }
  for (const role of USER_ROLES) {
    if (role === "employer") continue;
    if (isRolePath(pathname, role)) return role;
  }
  return null;
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
  | "history"
  | "search"
  | "send"
  | "circle-check"
  | "message-square"
  | "users"
  | "user-round"
  | "user-cog"
  | "clipboard-list"
  | "briefcase-business"
  | "calendar"
  | "building-2"
  | "user-circle";

export type NavItem = {
  href: string;
  label: string;
  icon: NavIcon;
};

export function getNavForRole(role: UserRole): NavItem[] {
  switch (role) {
    case "employer":
      return [
        { href: "/client/dashboard", label: "Dashboard", icon: "layout-dashboard" },
        { href: "/client/candidates", label: "Candidates", icon: "users" },
        { href: "/client/contracts", label: "Contracts", icon: "file-signature" },
        { href: "/client/employees", label: "Employees", icon: "user-round" },
        { href: "/client/invoices", label: "Invoices", icon: "receipt" },
        { href: "/client/job-requests", label: "Job Requests", icon: "clipboard-list" },
        { href: "/client/messages", label: "Messages", icon: "messages-square" },
        { href: "/client/profile", label: "Profile", icon: "user-cog" },
        { href: "/client/timesheets", label: "Timesheets", icon: "clipboard-check" },
      ];
    case "candidate":
      return [
        { href: "/candidate/dashboard", label: "Dashboard", icon: "layout-dashboard" },
        { href: "/candidate/applications", label: "Applications", icon: "send" },
        { href: "/candidate/jobs", label: "Available jobs", icon: "search" },
        { href: "/candidate/completions", label: "Completions", icon: "circle-check" },
        { href: "/candidate/contracts", label: "Contracts", icon: "file-signature" },
        { href: "/candidate/messages", label: "Messages", icon: "message-square" },
        { href: "/candidate/pay", label: "Pay", icon: "wallet" },
        { href: "/candidate/profile", label: "Profile", icon: "user" },
        { href: "/candidate/timesheets", label: "Timesheets", icon: "clock" },
      ];
    case "recruiter":
      return [
        { href: "/recruiter/dashboard", label: "Dashboard", icon: "layout-dashboard" },
        { href: "/recruiter/job-orders", label: "Job Orders", icon: "briefcase-business" },
        { href: "/recruiter/candidates", label: "Candidates in Pipeline", icon: "users" },
        { href: "/recruiter/interviews", label: "Interviews Scheduled", icon: "calendar" },
        { href: "/recruiter/placements", label: "Placements This Month", icon: "briefcase" },
        { href: "/recruiter/clients", label: "Clients", icon: "building-2" },
        { href: "/recruiter/messages", label: "Messages", icon: "message-square" },
        { href: "/recruiter/profile", label: "Profile", icon: "user-circle" },
      ];
    case "accounting":
      return [
        { href: "/accounting/dashboard", label: "Home", icon: "layout-dashboard" },
        { href: "/accounting/invoices", label: "Invoices", icon: "file-text" },
        { href: "/accounting/payroll", label: "Payroll", icon: "wallet" },
        { href: "/accounting/timesheets", label: "Timesheets", icon: "clock" },
        {
          href: "/accounting/accounts-receivable",
          label: "Accounts Receivable",
          icon: "receipt",
        },
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
    "/accounting/timesheets": "Timesheets",
    "/accounting/accounts-receivable": "Accounts Receivable",
    "/accounting/contracts": "Contracts",
    "/accounting/expenses": "Expenses",
    "/accounting/profitability": "Profitability",
    "/accounting/reports": "Financial Reports",
    "/accounting/audit-trail": "Audit Trail",
    "/accounting/messages": "Messages",
    "/accounting/profile": "Profile",
    "/client/dashboard": "Dashboard",
    "/client/candidates": "Candidates",
    "/client/contracts": "Contracts",
    "/client/employees": "Employees",
    "/client/invoices": "Invoices",
    "/client/job-requests": "Job Requests",
    "/client/messages": "Messages",
    "/client/profile": "Profile",
    "/client/timesheets": "Timesheets",
    "/employer/dashboard": "Dashboard",
    "/employer/timesheets": "Timesheet approval",
    "/candidate/dashboard": "Dashboard",
    "/candidate/applications": "Applications",
    "/candidate/jobs": "Available jobs",
    "/candidate/completions": "Completions",
    "/candidate/contracts": "Contracts",
    "/candidate/messages": "Messages",
    "/candidate/pay": "Pay",
    "/candidate/profile": "Profile",
    "/candidate/timesheets": "Timesheets",
    "/recruiter/dashboard": "Dashboard",
    "/recruiter/candidates": "Candidates in Pipeline",
    "/recruiter/job-orders": "Job Orders",
    "/recruiter/interviews": "Interviews Scheduled",
    "/recruiter/placements": "Placements This Month",
    "/recruiter/clients": "Clients",
    "/recruiter/messages": "Messages",
    "/recruiter/profile": "Profile",
  };

  if (map[pathname]) return map[pathname];
  if (pathname === "/accounting/invoices/new") return "Create Invoice";
  if (pathname.startsWith("/accounting/invoices/")) return "Invoice detail";
  if (pathname === "/accounting/expenses/new") return "Add Expense";
  if (pathname === "/accounting/reports/revenue") return "Revenue Report";
  if (pathname === "/accounting/reports/payroll") return "Payroll Report";
  if (pathname === "/accounting/reports/aging") return "Invoice Aging Report";
  if (pathname === "/accounting/reports/profitability")
    return "Profitability Report";
  if (pathname === "/accounting/reports/contract-revenue")
    return "Contract Revenue Report";
  if (pathname === "/accounting/reports/expense") return "Expense Report";
  if (pathname === "/accounting/reports/cash-flows")
    return "Statement of Cash Flows";
  if (pathname === "/accounting/reports/income-statement")
    return "Income Statement";
  if (pathname === "/accounting/reports/balance-sheet") return "Balance Sheet";
  if (pathname.startsWith("/accounting/reports/")) return "Report preview";
  if (pathname.startsWith("/accounting/timesheets/")) return "Timesheet detail";
  if (pathname.startsWith("/accounting/contracts/")) return "Contract detail";
  if (pathname.startsWith("/candidate/contracts/")) return "Contract detail";
  if (pathname.startsWith("/client/job-requests/new")) return "New Job Request";
  if (pathname.startsWith("/client/job-requests/")) return "Job Request";
  if (pathname.startsWith("/client/candidates/")) return "Candidate Profile";
  if (pathname.startsWith("/client/employees/")) return "Employee";
  if (pathname.startsWith("/client/contracts/")) return "Contract";
  if (pathname.startsWith("/client/timesheets/")) return "Timesheet";
  if (pathname.startsWith("/client/invoices/")) return "Invoice";
  if (pathname.startsWith("/recruiter/candidates/")) return "Candidate details";
  if (pathname.startsWith("/recruiter/job-orders/")) return "Job order details";
  if (pathname.startsWith("/recruiter/clients/")) return "Client details";
  return "TalentQuest";
}

/** Map legacy employer paths to client portal paths. */
export function employerToClientPath(pathname: string): string | null {
  if (pathname === "/employer" || pathname === "/employer/") {
    return "/client/dashboard";
  }
  if (pathname.startsWith("/employer/")) {
    const rest = pathname.slice("/employer".length);
    if (rest === "/timesheets" || rest.startsWith("/timesheets/")) {
      return `/client${rest}`;
    }
    if (rest === "/dashboard") {
      return "/client/dashboard";
    }
    return `/client${rest}`;
  }
  return null;
}
