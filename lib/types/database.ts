export type UserRole = "employer" | "candidate" | "recruiter" | "accounting";

export type PlacementType = "temp" | "permanent";
export type PlacementStatus = "active" | "completed" | "cancelled" | "at_risk";
export type EmploymentType = "temp" | "permanent";
export type EntityStatus = "active" | "inactive";
export type TimesheetStatus = "submitted" | "approved" | "disputed" | "rejected";
export type InvoiceStatus = "draft" | "sent" | "paid" | "partial" | "disputed";
export type PaymentStatus = "pending" | "completed" | "failed";

export type Client = {
  id: string;
  name: string;
  industry: string | null;
  billing_email: string | null;
  status: EntityStatus;
  created_at: string;
  updated_at: string;
};

export type Employee = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  employment_type: EmploymentType;
  status: EntityStatus;
  created_at: string;
  updated_at: string;
};

export type Placement = {
  id: string;
  client_id: string;
  employee_id: string;
  placement_type: PlacementType;
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
