-- Expenses table for accounting portal (TalentQuest)
-- Applied remotely as create_expenses_table

CREATE TYPE public.expense_category AS ENUM (
  'recruiter_labor',
  'advertising',
  'background_checks',
  'drug_screening',
  'payroll',
  'employee_wages',
  'referral_bonuses',
  'training',
  'miscellaneous'
);

CREATE TYPE public.expense_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'reimbursed'
);

CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  category public.expense_category NOT NULL DEFAULT 'miscellaneous',
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  placement_id uuid REFERENCES public.placements(id) ON DELETE SET NULL,
  amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
  status public.expense_status NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX expenses_expense_date_idx ON public.expenses(expense_date);
CREATE INDEX expenses_category_idx ON public.expenses(category);
CREATE INDEX expenses_client_id_idx ON public.expenses(client_id);
CREATE INDEX expenses_placement_id_idx ON public.expenses(placement_id);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY expenses_select_staff ON public.expenses
  FOR SELECT TO authenticated
  USING (public.is_staff());

CREATE POLICY expenses_write_staff ON public.expenses
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());
