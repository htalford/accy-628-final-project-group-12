export type UserRole = "employer" | "candidate" | "recruiter" | "accounting";

export type PlacementType = "temp" | "permanent";
export type PlacementStatus = "active" | "completed" | "cancelled" | "at_risk";
export type EmploymentType = "temp" | "permanent";
export type EntityStatus = "active" | "inactive";
export type TimesheetStatus = "submitted" | "approved" | "disputed" | "rejected";
export type InvoiceStatus = "draft" | "sent" | "paid" | "partial" | "disputed";
export type PaymentStatus = "pending" | "completed" | "failed";
export type JobStatus = "open" | "filled" | "closed";
export type ApplicationStatus =
  | "submitted"
  | "reviewing"
  | "interview"
  | "offered"
  | "rejected"
  | "withdrawn";

/** Placement-linked direct cost types (public.expenses.expense_type). */
export type ExpenseType =
  | "payroll_tax"
  | "workers_comp"
  | "benefits"
  | "recruiting_cost"
  | "travel"
  | "equipment"
  | "other";

export type ExpenseStatus = "pending" | "approved" | "rejected" | "reimbursed";

export type JournalEntryStatus = "draft" | "posted" | "void";

export type JournalEntrySourceType =
  | "invoice"
  | "payment"
  | "timesheet"
  | "expense"
  | "operating_expense"
  | "manual"
  | "opening";

/** Company overhead categories (public.operating_expenses.category). */
export type OperatingExpenseCategory =
  | "recruiter_salaries"
  | "accounting_salaries"
  | "office_rent"
  | "software_tools"
  | "marketing"
  | "recruiter_labor"
  | "advertising"
  | "background_checks"
  | "drug_screening"
  | "payroll"
  | "employee_wages"
  | "referral_bonuses"
  | "training"
  | "other";

/** @deprecated Prefer OperatingExpenseCategory — kept as an alias for overhead labels. */
export type ExpenseCategory = OperatingExpenseCategory;

/** Client Portal only — employer staffing requests (not public.jobs). */
export type JobRequestStatus = "open" | "in_progress" | "filled" | "closed";

/** Client Portal only — candidates submitted for a job request. */
export type SubmittalStage =
  | "submitted"
  | "under_review"
  | "interview"
  | "offer"
  | "accepted"
  | "rejected";

export type PortalJobRequest = {
  id: string;
  client_id: string;
  title: string;
  department: string;
  positions: number;
  status: JobRequestStatus;
  employment_type: string;
  location: string | null;
  pay_rate_text: string | null;
  start_date: string | null;
  skills: string[];
  description: string | null;
  notes: string | null;
  recruiter_name: string | null;
  /** Optional link to a public.jobs board posting. */
  source_job_id?: string | null;
  created_at: string;
  updated_at: string;
};

export type SubmittalExperience = {
  company: string;
  title: string;
  years: string;
};

export type PortalSubmittal = {
  id: string;
  job_request_id: string;
  client_id: string;
  employee_id: string | null;
  /** Linked candidate-portal application when sourced from the job board. */
  application_id?: string | null;
  candidate_name: string;
  candidate_email: string | null;
  candidate_phone: string | null;
  position_title: string;
  recruiter_name: string | null;
  years_experience: number | null;
  stage: SubmittalStage;
  resume_status: string;
  skills: string[];
  certifications: string[];
  experience: SubmittalExperience[];
  interview_notes: string | null;
  interview_at?: string | null;
  interview_type?: string | null;
  resume_summary: string | null;
  created_at: string;
  updated_at: string;
  job_title?: string | null;
};

/**
 * Unified Client Portal candidate row — recruiter submittals and
 * candidate-portal applications for company jobs.
 */
export type ClientCandidate = {
  id: string;
  source: "submittal" | "application";
  detail_href: string;
  candidate_name: string;
  candidate_email: string | null;
  candidate_phone: string | null;
  position_title: string;
  recruiter_name: string | null;
  years_experience: number | null;
  stage: SubmittalStage;
  /** Original application_status when source is application. */
  application_status?: ApplicationStatus | null;
  source_label: string;
  resume_status: string;
  skills: string[];
  certifications: string[];
  experience: SubmittalExperience[];
  interview_notes: string | null;
  resume_summary: string | null;
  cover_letter?: string | null;
  resume_url?: string | null;
  created_at: string;
  updated_at: string;
  job_title?: string | null;
  /** Automated fit vs the role they applied to (0–100). */
  match_score?: number | null;
  match_band?: "strong" | "good" | "fair" | "low" | null;
  match_reasons?: string[];
  /** Skills/keywords that contributed to the automated match. */
  match_skills?: string[];
  job_location?: string | null;
};

export type ClientMessageThread = {
  id: string;
  client_id: string;
  subject: string;
  recruiter_name: string;
  created_at: string;
  updated_at: string;
  /** Set when the employer moved the thread to Deleted (soft-delete). */
  deleted_at?: string | null;
  preview?: string;
  unread?: number;
  messages?: ClientPortalMessage[];
};

export type ClientPortalMessage = {
  id: string;
  thread_id: string;
  sender_role: "client" | "recruiter" | "staff";
  body: string;
  created_at: string;
};

export type Client = {
  id: string;
  name: string;
  industry: string | null;
  billing_email: string | null;
  status: EntityStatus;
  created_at: string;
  updated_at: string;
};

export type PreviousEmployment = {
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  description: string;
};

export type Employee = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  employment_type: EmploymentType;
  status: EntityStatus;
  certifications: string | null;
  resume_url: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  education_background?: string | null;
  previous_employments?: PreviousEmployment[] | null;
  created_at: string;
  updated_at: string;
};

export type Placement = {
  id: string;
  client_id: string;
  employee_id: string;
  placement_type: PlacementType;
  /** Job/role title for the assignment (e.g. Warehouse Associate). */
  title: string | null;
  bill_rate: number | null;
  pay_rate: number | null;
  placement_fee: number | null;
  guarantee_end_date: string | null;
  start_date: string;
  end_date: string | null;
  status: PlacementStatus;
  created_at: string;
  updated_at: string;
};

export type Timesheet = {
  id: string;
  placement_id: string;
  week_ending_date: string;
  hours_regular: number;
  hours_overtime: number;
  status: TimesheetStatus;
  /** Employer decision note (approve/reject) — employer-facing only. */
  employer_note?: string | null;
  created_at: string;
  updated_at: string;
};

export type Invoice = {
  id: string;
  client_id: string;
  placement_id: string | null;
  period_start: string;
  period_end: string;
  amount: number;
  status: InvoiceStatus;
  created_at: string;
  updated_at: string;
};

export type InvoiceLineItem = {
  id: string;
  invoice_id: string;
  timesheet_id: string | null;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  created_at: string;
  updated_at: string;
};

export type Payment = {
  id: string;
  invoice_id: string;
  amount: number;
  payment_date: string;
  status: PaymentStatus;
  created_at: string;
  updated_at: string;
};

/** Placement-linked direct cost (public.expenses). */
export type Expense = {
  id: string;
  placement_id: string;
  expense_type: ExpenseType;
  description: string;
  amount: number;
  expense_date: string;
  status: ExpenseStatus;
  created_at: string;
  updated_at: string;
};

/** Company overhead (public.operating_expenses). */
export type OperatingExpense = {
  id: string;
  category: OperatingExpenseCategory;
  description: string;
  amount: number;
  expense_date: string;
  month: string;
  created_at: string;
  updated_at: string;
};

export type JournalEntry = {
  id: string;
  entry_date: string;
  memo: string;
  reference: string;
  status: JournalEntryStatus;
  source_type: JournalEntrySourceType;
  source_id: string | null;
  created_by: string | null;
  posted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type JournalEntryLine = {
  id: string;
  journal_entry_id: string;
  line_no: number;
  account_code: string;
  account_name: string;
  description: string;
  debit: number;
  credit: number;
  created_at: string;
};

export type AppUser = {
  id: string;
  auth_id: string;
  name: string;
  email: string;
  role: UserRole;
  linked_client_id: string | null;
  linked_employee_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Job = {
  id: string;
  client_id: string | null;
  employer_name: string;
  title: string;
  description: string;
  location: string | null;
  employment_type: EmploymentType;
  pay_rate_min: number | null;
  pay_rate_max: number | null;
  status: JobStatus;
  posted_at: string;
  created_at: string;
  updated_at: string;
  recruiter_notes?: unknown;
  assigned_employee_id?: string | null;
};

export type Application = {
  id: string;
  job_id: string;
  employee_id: string;
  status: ApplicationStatus;
  note: string | null;
  cover_letter: string | null;
  resume_url: string | null;
  include_profile: boolean;
  profile_snapshot: Record<string, unknown> | null;
  interview_at?: string | null;
  interview_type?: string | null;
  interview_notes?: string | null;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  employee_id: string;
  sender_name: string;
  sender_role: string;
  /** Which staff portal owns this conversation: recruiter | accounting | system */
  counterpart_role?: "recruiter" | "accounting" | "system" | null;
  subject: string;
  body: string;
  is_read: boolean;
  staff_is_read?: boolean;
  created_at: string;
};
