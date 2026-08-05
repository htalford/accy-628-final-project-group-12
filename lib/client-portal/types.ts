/**
 * Client-safe types for the Client Portal (no server imports).
 * Server loaders live in queries.ts / chrome.ts.
 */
import type {
  AppUser,
  Client,
  Employee,
  Invoice,
  Placement,
  Timesheet,
} from "@/lib/types/database";

export type PlacementWithEmployee = Placement & {
  employee: Employee | null;
};

export type TimesheetWithDetails = Timesheet & {
  placement: PlacementWithEmployee | null;
  employee_name: string;
  position_title: string;
  bill_rate: number | null;
};

export type ActionItem = {
  id: string;
  kind: "timesheet" | "invoice" | "placement";
  title: string;
  detail: string;
  status: string;
  href: string;
};

export type ClientPortalData = {
  user: AppUser;
  client: Client | null;
  placements: PlacementWithEmployee[];
  timesheets: TimesheetWithDetails[];
  invoices: Invoice[];
  metrics: {
    openPositions: number;
    currentEmployees: number;
    pendingCandidateReviews: number;
    activeContracts: number;
    timesheetsAwaitingApproval: number;
    outstandingInvoices: number;
  };
  actionQueue: ActionItem[];
  recentActivity: {
    id: string;
    title: string;
    detail: string;
    timestamp: string;
    href?: string;
  }[];
};
