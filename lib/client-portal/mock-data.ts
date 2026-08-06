/**
 * Client Portal data derived from the Supabase seed
 * (project jklrdtzesordhgnxbstp). Scoped to the demo employer client:
 * Casey Employer → Northwind Logistics (11111111-…-111111111101).
 *
 * Domain tables in seed: clients, employees, placements, timesheets,
 * invoices, invoice_line_items, payments, users.
 * Portal-only surfaces without tables (job requests, candidates, messages)
 * use seed people + realistic extensions so the UI stays usable.
 */

export type JobRequestStatus = "Open" | "In Progress" | "Filled" | "Closed";
export type AssignmentStatus = "Active" | "At Risk" | "Completed" | "Cancelled" | "On Hold";
export type ContractStatus = "Active" | "Completed" | "Cancelled" | "At Risk";
export type TimesheetStatus = "Pending" | "Approved" | "Disputed" | "Rejected";
export type InvoiceStatus = "Paid" | "Pending" | "Overdue" | "Partial" | "Disputed" | "Draft";
export type HiringStage =
  | "Submitted"
  | "Under Review"
  | "Interview"
  | "Offer"
  | "Accepted"
  | "Rejected";
export type ResumeStatus = "On File" | "Pending" | "Updated";

/* ─── Stable seed UUIDs ───────────────────────────────────────────── */

export const SEED = {
  clients: {
    northwind: "11111111-1111-1111-1111-111111111101",
    summit: "11111111-1111-1111-1111-111111111102",
    prairie: "11111111-1111-1111-1111-111111111103",
  },
  employees: {
    jordanLee: "22222222-2222-2222-2222-222222222201",
    samPatel: "22222222-2222-2222-2222-222222222202",
    alexNguyen: "22222222-2222-2222-2222-222222222203",
    mayaOrtiz: "22222222-2222-2222-2222-222222222204",
    chrisBennett: "22222222-2222-2222-2222-222222222205",
    priyaShah: "22222222-2222-2222-2222-222222222206",
    devonBrooks: "22222222-2222-2222-2222-222222222207",
    rileyQuinn: "22222222-2222-2222-2222-222222222208",
    taylorKim: "22222222-2222-2222-2222-222222222209",
    jadeMorales: "22222222-2222-2222-2222-222222222210",
    blakeTurner: "22222222-2222-2222-2222-222222222211",
    owenGrant: "22222222-2222-2222-2222-222222222212",
    elenaVargas: "22222222-2222-2222-2222-222222222213",
    marcusHale: "22222222-2222-2222-2222-222222222214",
    hannahCho: "22222222-2222-2222-2222-222222222215",
    ninaVolkov: "22222222-2222-2222-2222-222222222216",
    carlosMendez: "22222222-2222-2222-2222-222222222217",
    ianFoster: "22222222-2222-2222-2222-222222222218",
    /** Demo Candidate portal identity (no Northwind placement). */
    chadStefaniak: "22222222-2222-2222-2222-222222222219",
  },
  placements: {
    jordanNorthwind: "33333333-3333-3333-3333-333333333301",
    alexNorthwind: "33333333-3333-3333-3333-333333333302",
    samSummit: "33333333-3333-3333-3333-333333333303",
    mayaPrairie: "33333333-3333-3333-3333-333333333304",
    chrisSummitCompleted: "33333333-3333-3333-3333-333333333305",
    chrisSummitActive: "33333333-3333-3333-3333-333333333306",
    blakeNorthwind: "33333333-3333-3333-3333-333333333308",
    carlosNorthwind: "33333333-3333-3333-3333-333333333317",
  },
  timesheets: {
    jordan0718: "44444444-4444-4444-4444-444444444401",
    jordan0725: "44444444-4444-4444-4444-444444444402",
    jordan0801: "44444444-4444-4444-4444-444444444403",
    alex0801: "44444444-4444-4444-4444-444444444404",
  },
  invoices: {
    paid2352: "55555555-5555-5555-5555-555555555501",
    partial18000: "55555555-5555-5555-5555-555555555502",
    sent1920: "55555555-5555-5555-5555-555555555503",
    disputed1344: "55555555-5555-5555-5555-555555555504",
  },
} as const;

export const DEMO_EMPLOYER_CLIENT_ID = SEED.clients.northwind;

/* ─── Domain view models (portal-facing) ──────────────────────────── */

export type DashboardMetrics = {
  openPositions: number;
  currentEmployees: number;
  pendingCandidateReviews: number;
  activeContracts: number;
  timesheetsAwaitingApproval: number;
  outstandingInvoices: number;
};

export type ActivityItem = {
  id: string;
  type: "candidate" | "timesheet" | "employee" | "invoice";
  title: string;
  detail: string;
  timestamp: string;
};

export type JobRequest = {
  id: string;
  title: string;
  department: string;
  positions: number;
  recruiter: string;
  dateRequested: string;
  status: JobRequestStatus;
  employmentType: string;
  location: string;
  payRate: string;
  startDate: string;
  skills: string[];
  description: string;
  notes: string;
};

export type Candidate = {
  id: string;
  name: string;
  position: string;
  recruiter: string;
  yearsExperience: number;
  resumeStatus: ResumeStatus;
  stage: HiringStage;
  email: string;
  phone: string;
  skills: string[];
  certifications: string[];
  experience: { company: string; title: string; years: string }[];
  interviewNotes: string;
  resumeSummary: string;
};

export type Employee = {
  id: string;
  name: string;
  position: string;
  startDate: string;
  status: AssignmentStatus;
  recruiter: string;
  currentHours: number;
  email: string;
  phone: string;
  placementId: string;
  placementType: "temp" | "permanent";
  billRate: number | null;
  payRate: number | null;
  weeklyHours: { week: string; hours: number }[];
  timesheetHistory: { weekEnding: string; total: number; status: TimesheetStatus }[];
  notes: string;
};

export type Contract = {
  id: string;
  number: string;
  name: string;
  startDate: string;
  endDate: string | null;
  billingType: string;
  recruiter: string;
  status: ContractStatus;
  daysRemaining: number | null;
  positionsCovered: string[];
  billingInfo: string;
  documents: string[];
  renewalStatus: string;
  summary: string;
  employeeName: string;
  placementType: "temp" | "permanent";
};

export type Timesheet = {
  id: string;
  employeeId: string;
  employeeName: string;
  weekEnding: string;
  regularHours: number;
  overtimeHours: number;
  totalHours: number;
  status: TimesheetStatus;
  dailyHours: { day: string; hours: number }[];
  employeeNotes: string;
  approvalHistory: { action: string; by: string; at: string }[];
  placementId: string;
  billRate: number;
};

export type Invoice = {
  id: string;
  number: string;
  billingPeriod: string;
  amount: number;
  dueDate: string;
  status: InvoiceStatus;
  periodStart: string;
  periodEnd: string;
  seedStatus: string;
};

export type MessageThread = {
  id: string;
  recruiterName: string;
  preview: string;
  unread: number;
  messages: { id: string; from: "recruiter" | "client"; body: string; at: string }[];
};

export type NotificationItem = {
  id: string;
  title: string;
  detail: string;
  time: string;
  href: string;
};

export type GlobalSearchHit = {
  id: string;
  category: "Employees" | "Candidates" | "Job Requests" | "Contracts" | "Invoices";
  label: string;
  sublabel: string;
  href: string;
};

export type CompanyProfile = {
  companyName: string;
  industry: string;
  primaryContact: string;
  phone: string;
  email: string;
  address: string;
  username: string;
  companyId: string;
  memberSince: string;
  preferredPositions: string[];
  preferredRecruiter: string;
  hiringLocations: string[];
};

/* ─── Seed client (employer view) ─────────────────────────────────── */

export const COMPANY_NAME = "Northwind Logistics";

export const companyProfile: CompanyProfile = {
  companyName: "Northwind Logistics",
  industry: "Logistics",
  primaryContact: "Casey Employer",
  phone: "(555) 200-0100",
  email: "employer@talentquest.demo",
  address: "1200 Freight Way, Des Moines, IA 50309",
  username: "employer@talentquest.demo",
  companyId: SEED.clients.northwind,
  memberSince: "January 2025",
  preferredPositions: ["Warehouse Associate", "Logistics Coordinator", "Forklift Operator"],
  preferredRecruiter: "Morgan Recruiter",
  hiringLocations: ["Des Moines, IA", "Ames, IA"],
};

/** Seed users referenced in activity / approval history */
const RECRUITER = "Morgan Recruiter";
const EMPLOYER = "Casey Employer";

/**
 * Northwind placements only (linked_client_id of employer).
 * Positions are labels for display (no job-title column in seed placements).
 */
export const employees: Employee[] = [
  {
    id: SEED.employees.jordanLee,
    name: "Jordan Lee",
    position: "Warehouse Associate (Temp)",
    startDate: "2026-06-01",
    status: "Active",
    recruiter: RECRUITER,
    currentHours: 40,
    email: "jordan.lee@example.com",
    phone: "555-0101",
    placementId: SEED.placements.jordanNorthwind,
    placementType: "temp",
    billRate: 48,
    payRate: 28,
    weeklyHours: [
      { week: "Jul 13", hours: 46 },
      { week: "Jul 20", hours: 40 },
      { week: "Jul 27", hours: 40 },
    ],
    timesheetHistory: [
      { weekEnding: "2026-07-18", total: 46, status: "Approved" },
      { weekEnding: "2026-07-25", total: 40, status: "Approved" },
      { weekEnding: "2026-08-01", total: 40, status: "Pending" },
    ],
    notes:
      "Seed placement 3333…301 · temp · bill $48 / pay $28. Northwind placed employee (Candidate portal login is Chad Stefaniak).",
  },
  {
    id: SEED.employees.alexNguyen,
    name: "Alex Nguyen",
    position: "Logistics Coordinator (Temp)",
    startDate: "2026-05-12",
    status: "At Risk",
    recruiter: RECRUITER,
    currentHours: 32,
    email: "alex.nguyen@example.com",
    phone: "555-0103",
    placementId: SEED.placements.alexNorthwind,
    placementType: "temp",
    billRate: 42,
    payRate: 40,
    weeklyHours: [{ week: "Jul 27", hours: 32 }],
    timesheetHistory: [
      { weekEnding: "2026-08-01", total: 32, status: "Disputed" },
    ],
    notes:
      "Seed placement 3333…302 · at_risk · thin margin (bill $42 / pay $40).",
  },
  {
    id: SEED.employees.blakeTurner,
    name: "Blake Turner",
    position: "Forklift Operator (Temp)",
    startDate: "2025-08-18",
    status: "Active",
    recruiter: RECRUITER,
    currentHours: 40,
    email: "blake.turner@example.com",
    phone: "555-0111",
    placementId: SEED.placements.blakeNorthwind,
    placementType: "temp",
    billRate: 46,
    payRate: 29,
    weeklyHours: [
      { week: "Feb 14", hours: 40 },
      { week: "Feb 21", hours: 40 },
    ],
    timesheetHistory: [
      { weekEnding: "2026-02-14", total: 40, status: "Approved" },
      { weekEnding: "2026-02-21", total: 40, status: "Approved" },
    ],
    notes:
      "Seed placement 3333…308 · temp · bill $46 / pay $29. Linked timesheets, invoice, and expenses.",
  },
  {
    id: SEED.employees.carlosMendez,
    name: "Carlos Mendez",
    position: "Accounts Payable Analyst (Temp)",
    startDate: "2026-03-02",
    status: "Active",
    recruiter: RECRUITER,
    currentHours: 40,
    email: "carlos.mendez@example.com",
    phone: "555-0117",
    placementId: SEED.placements.carlosNorthwind,
    placementType: "temp",
    billRate: 47,
    payRate: 28,
    weeklyHours: [],
    timesheetHistory: [],
    notes:
      "Seed placement for Carlos Mendez at Northwind Logistics.",
  },
];

/**
 * Placements ↔ portal “contracts” for Northwind.
 */
export const contracts: Contract[] = [
  {
    id: SEED.placements.jordanNorthwind,
    number: "PL-3301",
    name: "Jordan Lee — Warehouse Associate",
    startDate: "2026-06-01",
    endDate: null,
    billingType: "Time & materials (temp)",
    recruiter: RECRUITER,
    status: "Active",
    daysRemaining: null,
    positionsCovered: ["Warehouse Associate"],
    billingInfo: "bill_rate $48.00 · pay_rate $28.00 · OT billed at 1.5× bill_rate",
    documents: ["Placement_Agreement.pdf", "W4_Onfile.pdf"],
    renewalStatus: "Open-ended temp assignment",
    summary:
      "Active temporary placement at Northwind Logistics for Jordan Lee (seed placement 3333…301).",
    employeeName: "Jordan Lee",
    placementType: "temp",
  },
  {
    id: SEED.placements.blakeNorthwind,
    number: "PL-3308",
    name: "Blake Turner — Forklift Operator",
    startDate: "2025-08-18",
    endDate: null,
    billingType: "Time & materials (temp)",
    recruiter: RECRUITER,
    status: "Active",
    daysRemaining: null,
    positionsCovered: ["Forklift Operator"],
    billingInfo: "bill_rate $46.00 · pay_rate $29.00 · OT billed at 1.5× bill_rate",
    documents: ["Placement_Agreement.pdf"],
    renewalStatus: "Open-ended temp assignment",
    summary:
      "Active temporary placement at Northwind Logistics for Blake Turner (seed placement 3333…308).",
    employeeName: "Blake Turner",
    placementType: "temp",
  },
  {
    id: SEED.placements.carlosNorthwind,
    number: "PL-3317",
    name: "Carlos Mendez — Accounts Payable Analyst",
    startDate: "2026-03-02",
    endDate: null,
    billingType: "Time & materials (temp)",
    recruiter: RECRUITER,
    status: "Active",
    daysRemaining: null,
    positionsCovered: ["Accounts Payable Analyst"],
    billingInfo: "bill_rate $47.00 · pay_rate $28.00 · OT billed at 1.5× bill_rate",
    documents: ["Placement_Agreement.pdf"],
    renewalStatus: "Open-ended temp assignment",
    summary:
      "Active temporary placement at Northwind Logistics for Carlos Mendez (seed placement 3333…317).",
    employeeName: "Carlos Mendez",
    placementType: "temp",
  },
  {
    id: SEED.placements.alexNorthwind,
    number: "PL-3302",
    name: "Alex Nguyen — Logistics Coordinator",
    startDate: "2026-05-12",
    endDate: null,
    billingType: "Time & materials (temp)",
    recruiter: RECRUITER,
    status: "At Risk",
    daysRemaining: null,
    positionsCovered: ["Logistics Coordinator"],
    billingInfo: "bill_rate $42.00 · pay_rate $40.00 · margin under review",
    documents: ["Placement_Agreement.pdf"],
    renewalStatus: "Flagged at_risk in seed data",
    summary:
      "At-risk temp placement (seed 3333…302). Low bill/pay spread.",
    employeeName: "Alex Nguyen",
    placementType: "temp",
  },
];

function splitDaily(regular: number, ot: number): { day: string; hours: number }[] {
  // Represent weekly totals across Mon–Fri + OT on Wed if needed
  const base = regular / 5;
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return days.map((day, i) => {
    if (i < 5) return { day, hours: Number((base + (i === 2 ? ot : 0)).toFixed(2)) };
    return { day, hours: 0 };
  });
}

export const timesheets: Timesheet[] = [
  {
    id: SEED.timesheets.jordan0801,
    employeeId: SEED.employees.jordanLee,
    employeeName: "Jordan Lee",
    weekEnding: "2026-08-01",
    regularHours: 40,
    overtimeHours: 0,
    totalHours: 40,
    status: "Pending",
    dailyHours: splitDaily(40, 0),
    employeeNotes: "Seed timesheet status: submitted.",
    approvalHistory: [
      { action: "Submitted", by: "Jordan Lee", at: "2026-08-02 08:00" },
    ],
    placementId: SEED.placements.jordanNorthwind,
    billRate: 48,
  },
  {
    id: SEED.timesheets.alex0801,
    employeeId: SEED.employees.alexNguyen,
    employeeName: "Alex Nguyen",
    weekEnding: "2026-08-01",
    regularHours: 32,
    overtimeHours: 0,
    totalHours: 32,
    status: "Disputed",
    dailyHours: splitDaily(32, 0),
    employeeNotes: "Seed timesheet status: disputed (invoice INV-5504 linked).",
    approvalHistory: [
      { action: "Submitted", by: "Alex Nguyen", at: "2026-08-02 09:10" },
      { action: "Disputed", by: EMPLOYER, at: "2026-08-03 11:00" },
    ],
    placementId: SEED.placements.alexNorthwind,
    billRate: 42,
  },
  {
    id: SEED.timesheets.jordan0725,
    employeeId: SEED.employees.jordanLee,
    employeeName: "Jordan Lee",
    weekEnding: "2026-07-25",
    regularHours: 40,
    overtimeHours: 0,
    totalHours: 40,
    status: "Approved",
    dailyHours: splitDaily(40, 0),
    employeeNotes: "Seed timesheet status: approved · billed on INV-5503.",
    approvalHistory: [
      { action: "Submitted", by: "Jordan Lee", at: "2026-07-26 08:00" },
      { action: "Approved", by: EMPLOYER, at: "2026-07-26 10:00" },
    ],
    placementId: SEED.placements.jordanNorthwind,
    billRate: 48,
  },
  {
    id: SEED.timesheets.jordan0718,
    employeeId: SEED.employees.jordanLee,
    employeeName: "Jordan Lee",
    weekEnding: "2026-07-18",
    regularHours: 40,
    overtimeHours: 6,
    totalHours: 46,
    status: "Approved",
    dailyHours: splitDaily(40, 6),
    employeeNotes: "6 OT hours · seed · paid invoice INV-5501 ($2,352).",
    approvalHistory: [
      { action: "Submitted", by: "Jordan Lee", at: "2026-07-19 08:00" },
      { action: "Approved", by: EMPLOYER, at: "2026-07-19 14:00" },
    ],
    placementId: SEED.placements.jordanNorthwind,
    billRate: 48,
  },
];

/** Northwind invoices only (employer RLS scope). */
export const invoices: Invoice[] = [
  {
    id: SEED.invoices.disputed1344,
    number: "INV-5504",
    billingPeriod: "Jul 27 – Aug 1, 2026",
    periodStart: "2026-07-27",
    periodEnd: "2026-08-01",
    amount: 1344,
    dueDate: "2026-08-15",
    status: "Disputed",
    seedStatus: "disputed",
  },
  {
    id: SEED.invoices.sent1920,
    number: "INV-5503",
    billingPeriod: "Jul 20 – Jul 25, 2026",
    periodStart: "2026-07-20",
    periodEnd: "2026-07-25",
    amount: 1920,
    dueDate: "2026-08-10",
    status: "Pending",
    seedStatus: "sent",
  },
  {
    id: SEED.invoices.paid2352,
    number: "INV-5501",
    billingPeriod: "Jul 13 – Jul 18, 2026",
    periodStart: "2026-07-13",
    periodEnd: "2026-07-18",
    amount: 2352,
    dueDate: "2026-07-28",
    status: "Paid",
    seedStatus: "paid",
  },
];

export const invoiceSummary = {
  totalOutstanding: 1920 + 1344, // sent + disputed
  paidThisMonth: 2352, // completed payment 2026-07-28
  overdueCount: 0,
  disputedCount: 1,
};

/**
 * Seed employees not currently on a Northwind placement — used as
 * “candidates submitted by agency” for the Candidates page.
 */
export const candidates: Candidate[] = [
  {
    id: SEED.employees.chadStefaniak,
    name: "Chad Stefaniak",
    position: "Accounts Payable Analyst",
    recruiter: RECRUITER,
    yearsExperience: 10,
    resumeStatus: "On File",
    stage: "Submitted",
    email: "chad.stefaniak@example.com",
    phone: "555-0219",
    skills: [
      "Microsoft Office",
      "Inventory tracking",
      "Schedule coordination",
      "Customer service",
      "Team leadership",
    ],
    certifications: ["OSHA 10", "First Aid / CPR", "Forklift certification"],
    experience: [
      {
        company: "University of Mississippi",
        title: "Associate Professor",
        years: "2025–Present",
      },
      {
        company: "U.S. Navy",
        title: "Cryptologic / Signals Specialist",
        years: "2014–2021",
      },
      {
        company: "Blackwater Drift Co.",
        title: "River Outfitter & Operations Lead",
        years: "2011–2014",
      },
    ],
    interviewNotes: "Demo Candidate portal identity (candidate@talentquest.demo).",
    resumeSummary:
      "Demo candidate Chad Stefaniak — Ole Miss + Navy signals + river ops background.",
  },
  {
    id: SEED.employees.rileyQuinn,
    name: "Riley Quinn",
    position: "Warehouse Associate",
    recruiter: RECRUITER,
    yearsExperience: 3,
    resumeStatus: "On File",
    stage: "Under Review",
    email: "riley.quinn@example.com",
    phone: "555-0108",
    skills: ["Forklift", "RF scanners", "Inventory"],
    certifications: ["OSHA Forklift"],
    experience: [
      { company: "Midwest Fulfillment", title: "Warehouse Associate", years: "2023–2026" },
    ],
    interviewNotes: "Available for second shift at Northwind.",
    resumeSummary: "Seed employee Riley Quinn (no active Northwind placement).",
  },
  {
    id: SEED.employees.taylorKim,
    name: "Taylor Kim",
    position: "Logistics Coordinator",
    recruiter: RECRUITER,
    yearsExperience: 6,
    resumeStatus: "Updated",
    stage: "Interview",
    email: "taylor.kim@example.com",
    phone: "555-0109",
    skills: ["TMS", "Routing", "Customer service"],
    certifications: [],
    experience: [
      { company: "ClearPath Transit", title: "Dispatcher", years: "2020–2026" },
    ],
    interviewNotes: "Permanent hire candidate from seed roster.",
    resumeSummary: "Seed employee Taylor Kim (permanent employment_type, unassigned).",
  },
  {
    id: SEED.employees.priyaShah,
    name: "Priya Shah",
    position: "Warehouse Lead",
    recruiter: RECRUITER,
    yearsExperience: 8,
    resumeStatus: "On File",
    stage: "Submitted",
    email: "priya.shah@example.com",
    phone: "555-0106",
    skills: ["Team lead", "Safety", "Cycle counts"],
    certifications: ["OSHA 30"],
    experience: [
      { company: "Prairie Manufacturing Co.", title: "Shift Lead", years: "2018–2026" },
    ],
    interviewNotes: "Permanent employment_type in seed.",
    resumeSummary: "Seed employee Priya Shah.",
  },
];

/** Not in DB tables — minimal open reqs that match Northwind staffing needs. */
export const jobRequests: JobRequest[] = [
  {
    id: "jr-nw-01",
    title: "Warehouse Associate",
    department: "Operations",
    positions: 2,
    recruiter: RECRUITER,
    dateRequested: "2026-07-20",
    status: "In Progress",
    employmentType: "Temporary",
    location: "Des Moines, IA",
    payRate: "$26–$30 / hr",
    startDate: "2026-08-18",
    skills: ["Forklift", "Pick/pack", "Safety"],
    description:
      "Support peak freight volume on dock (aligned with Northwind Logistics seed client).",
    notes: "Recruiter reviewing Riley Quinn from seed employee roster.",
  },
  {
    id: "jr-nw-02",
    title: "Logistics Coordinator",
    department: "Logistics",
    positions: 1,
    recruiter: RECRUITER,
    dateRequested: "2026-07-28",
    status: "Open",
    employmentType: "Contract-to-hire",
    location: "Des Moines, IA",
    payRate: "$32–$38 / hr",
    startDate: "2026-09-01",
    skills: ["TMS", "Routing", "Communication"],
    description: "Coordinate outbound freight and carrier appointments.",
    notes: "Taylor Kim is a seed roster match.",
  },
];

export const recentActivity: ActivityItem[] = [
  {
    id: "a1",
    type: "timesheet",
    title: "Timesheet submitted",
    detail: "Jordan Lee · week ending 2026-08-01 · awaiting approval",
    timestamp: "Aug 2 · seed WE 2026-08-01",
  },
  {
    id: "a2",
    type: "timesheet",
    title: "Timesheet disputed",
    detail: "Alex Nguyen · week ending 2026-08-01",
    timestamp: "Aug 3 · seed status disputed",
  },
  {
    id: "a3",
    type: "invoice",
    title: "Invoice paid",
    detail: "INV-5501 · $2,352.00 (Jordan Lee OT week)",
    timestamp: "Jul 28 · payment completed",
  },
  {
    id: "a4",
    type: "invoice",
    title: "Invoice sent",
    detail: "INV-5503 · $1,920.00 · week ending Jul 25",
    timestamp: "Jul 26 · seed status sent",
  },
];

export const dashboardMetrics: DashboardMetrics = {
  openPositions: jobRequests.filter((j) => j.status === "Open" || j.status === "In Progress")
    .reduce((n, j) => n + j.positions, 0),
  currentEmployees: employees.filter((e) => e.status === "Active" || e.status === "At Risk")
    .length,
  pendingCandidateReviews: candidates.filter(
    (c) => c.stage === "Submitted" || c.stage === "Under Review",
  ).length,
  activeContracts: contracts.filter((c) => c.status === "Active" || c.status === "At Risk")
    .length,
  timesheetsAwaitingApproval: timesheets.filter((t) => t.status === "Pending").length,
  outstandingInvoices: invoices.filter((i) => i.status !== "Paid").length,
};

export const messageThreads: MessageThread[] = [
  {
    id: "msg-1",
    recruiterName: RECRUITER,
    preview: "Alex Nguyen placement flagged at_risk…",
    unread: 1,
    messages: [
      {
        id: "m1",
        from: "recruiter",
        body: "Casey — seed placement PL-3302 (Alex Nguyen) is marked at_risk because bill_rate is only $2 over pay_rate. Want me to renegotiate?",
        at: "Mon 10:12 AM",
      },
      {
        id: "m2",
        from: "client",
        body: "Yes — hold that assignment and queue Taylor Kim if the margin can't improve.",
        at: "Mon 11:05 AM",
      },
    ],
  },
  {
    id: "msg-2",
    recruiterName: RECRUITER,
    preview: "Jordan Lee OT week billed on INV-5501…",
    unread: 0,
    messages: [
      {
        id: "m3",
        from: "recruiter",
        body: "INV-5501 ($2,352) for Jordan’s OT week is marked paid in seed payments. Thanks for the quick payment.",
        at: "Jul 28",
      },
    ],
  },
];

export const notifications: NotificationItem[] = [
  {
    id: "n1",
    title: "Timesheet awaiting approval",
    detail: "Jordan Lee · week ending 2026-08-01",
    time: "Seed · submitted",
    href: `/client/timesheets/${SEED.timesheets.jordan0801}`,
  },
  {
    id: "n2",
    title: "Timesheet disputed",
    detail: "Alex Nguyen · week ending 2026-08-01",
    time: "Seed · disputed",
    href: `/client/timesheets/${SEED.timesheets.alex0801}`,
  },
  {
    id: "n3",
    title: "Invoice sent",
    detail: "INV-5503 · $1,920.00",
    time: "Seed · sent",
    href: "/client/invoices",
  },
  {
    id: "n4",
    title: "Invoice disputed",
    detail: "INV-5504 · $1,344.00",
    time: "Seed · disputed",
    href: "/client/invoices",
  },
];

export function getGlobalSearchHits(query: string): GlobalSearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const hits: GlobalSearchHit[] = [];

  for (const e of employees) {
    if (e.name.toLowerCase().includes(q) || e.position.toLowerCase().includes(q)) {
      hits.push({
        id: `se-${e.id}`,
        category: "Employees",
        label: e.name,
        sublabel: e.position,
        href: `/client/employees/${e.id}`,
      });
    }
  }
  for (const c of candidates) {
    if (c.name.toLowerCase().includes(q) || c.position.toLowerCase().includes(q)) {
      hits.push({
        id: `sc-${c.id}`,
        category: "Candidates",
        label: c.name,
        sublabel: c.position,
        href: `/client/candidates/${c.id}`,
      });
    }
  }
  for (const j of jobRequests) {
    if (j.title.toLowerCase().includes(q) || j.department.toLowerCase().includes(q)) {
      hits.push({
        id: `sj-${j.id}`,
        category: "Job Requests",
        label: j.title,
        sublabel: j.department,
        href: `/client/job-requests/${j.id}`,
      });
    }
  }
  for (const c of contracts) {
    if (
      c.number.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.employeeName.toLowerCase().includes(q)
    ) {
      hits.push({
        id: `sct-${c.id}`,
        category: "Contracts",
        label: c.number,
        sublabel: c.name,
        href: `/client/contracts/${c.id}`,
      });
    }
  }
  for (const inv of invoices) {
    if (inv.number.toLowerCase().includes(q)) {
      hits.push({
        id: `si-${inv.id}`,
        category: "Invoices",
        label: inv.number,
        sublabel: inv.billingPeriod,
        href: "/client/invoices",
      });
    }
  }

  return hits.slice(0, 12);
}

export function formatCurrency(amount: number): string {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

export function getJobRequest(id: string) {
  return jobRequests.find((j) => j.id === id);
}
export function getCandidate(id: string) {
  return candidates.find((c) => c.id === id);
}
export function getEmployee(id: string) {
  return employees.find((e) => e.id === id);
}
export function getContract(id: string) {
  return contracts.find((c) => c.id === id);
}
export function getTimesheet(id: string) {
  return timesheets.find((t) => t.id === id);
}
