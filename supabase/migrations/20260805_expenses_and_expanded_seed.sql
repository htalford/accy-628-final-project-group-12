-- Local mirror: expense tracking + expanded seed (applied remotely via Supabase MCP)
-- Project: jklrdtzesordhgnxbstp (ACCY 628 - Final Project - Group 12)
-- Branch work: houstonalford-expenses
--
-- Remote actions already applied:
-- 1) Reshaped public.expenses (placement-linked direct costs) with staff-only RLS
-- 2) Created public.operating_expenses (company overhead) with staff-only RLS
-- 3) Expanded seed: 5 clients, 18 employees, 18 placements, timesheets/invoices,
--    direct expenses, and 3 months recurring OpEx + 2 one-time OpEx rows
--
-- Enums:
--   expense_type: payroll_tax, workers_comp, benefits, recruiting_cost, travel, equipment, other
--   expense_status: pending, approved, rejected, reimbursed (reused existing type)
--   operating_expense_category: recruiter_salaries, accounting_salaries, office_rent,
--                               software_tools, marketing, other
--
-- RLS: SELECT/INSERT/UPDATE/DELETE for authenticated when public.is_staff()
--      (recruiter + accounting). Employer/candidate have no access.
--
-- Dashboard labeling (do not blend these):
--   "Annualized Revenue (Run-Rate)" ≈ bill_rate × 2080 on active/at_risk temps
--     + completed engagement revenue + permanent fees (~$1.2M)
--   "Invoiced to Date" / "Collected to Date" from sample invoices (much smaller)

CREATE TYPE public.expense_type AS ENUM (
  'payroll_tax', 'workers_comp', 'benefits', 'recruiting_cost', 'travel', 'equipment', 'other'
);

CREATE TYPE public.operating_expense_category AS ENUM (
  'recruiter_salaries', 'accounting_salaries', 'office_rent', 'software_tools', 'marketing', 'other'
);

CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  placement_id uuid NOT NULL REFERENCES public.placements(id) ON DELETE CASCADE,
  expense_type public.expense_type NOT NULL,
  description text NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  status public.expense_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.operating_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category public.operating_expense_category NOT NULL,
  description text NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  month date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT operating_expenses_month_first_of_month CHECK (
    date_trunc('month', month::timestamp)::date = month
  )
);

CREATE INDEX expenses_placement_id_idx ON public.expenses(placement_id);
CREATE INDEX expenses_expense_date_idx ON public.expenses(expense_date);
CREATE INDEX operating_expenses_month_idx ON public.operating_expenses(month);
CREATE INDEX operating_expenses_category_idx ON public.operating_expenses(category);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operating_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY expenses_staff_all ON public.expenses
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE POLICY operating_expenses_staff_all ON public.operating_expenses
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());
