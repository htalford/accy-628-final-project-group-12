-- Local mirror of remote migration: talentquest_schema_rls
-- Applied to Supabase project jklrdtzesordhgnxbstp (ACCY 628 - Final Project - Group 12).
-- Seed data and demo auth users were applied via follow-up SQL (not replayed here).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE public.user_role AS ENUM ('employer', 'candidate', 'recruiter', 'accounting');
CREATE TYPE public.placement_type AS ENUM ('temp', 'permanent');
CREATE TYPE public.placement_status AS ENUM ('active', 'completed', 'cancelled', 'at_risk');
CREATE TYPE public.employment_type AS ENUM ('temp', 'permanent');
CREATE TYPE public.entity_status AS ENUM ('active', 'inactive');
CREATE TYPE public.timesheet_status AS ENUM ('submitted', 'approved', 'disputed', 'rejected');
CREATE TYPE public.invoice_status AS ENUM ('draft', 'sent', 'paid', 'partial', 'disputed');
CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed');

CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  industry text,
  billing_email text,
  status public.entity_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  employment_type public.employment_type NOT NULL DEFAULT 'temp',
  status public.entity_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.placements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
  placement_type public.placement_type NOT NULL,
  bill_rate numeric(10,2),
  pay_rate numeric(10,2),
  placement_fee numeric(12,2),
  guarantee_end_date date,
  start_date date NOT NULL,
  end_date date,
  status public.placement_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT placements_temp_rates_chk CHECK (
    placement_type <> 'temp' OR (bill_rate IS NOT NULL AND pay_rate IS NOT NULL)
  ),
  CONSTRAINT placements_perm_fee_chk CHECK (
    placement_type <> 'permanent' OR placement_fee IS NOT NULL
  )
);

CREATE TABLE public.timesheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  placement_id uuid NOT NULL REFERENCES public.placements(id) ON DELETE CASCADE,
  week_ending_date date NOT NULL,
  hours_regular numeric(6,2) NOT NULL DEFAULT 0,
  hours_overtime numeric(6,2) NOT NULL DEFAULT 0,
  status public.timesheet_status NOT NULL DEFAULT 'submitted',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  placement_id uuid REFERENCES public.placements(id) ON DELETE SET NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  status public.invoice_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.invoice_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  timesheet_id uuid REFERENCES public.timesheets(id) ON DELETE SET NULL,
  description text NOT NULL,
  quantity numeric(10,2) NOT NULL DEFAULT 1,
  rate numeric(10,2) NOT NULL DEFAULT 0,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  status public.payment_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  role public.user_role NOT NULL,
  linked_client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  linked_employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_employer_link_chk CHECK (
    role <> 'employer' OR linked_client_id IS NOT NULL
  ),
  CONSTRAINT users_candidate_link_chk CHECK (
    role <> 'candidate' OR linked_employee_id IS NOT NULL
  )
);

CREATE INDEX placements_client_id_idx ON public.placements(client_id);
CREATE INDEX placements_employee_id_idx ON public.placements(employee_id);
CREATE INDEX timesheets_placement_id_idx ON public.timesheets(placement_id);
CREATE INDEX invoices_client_id_idx ON public.invoices(client_id);
CREATE INDEX invoice_line_items_invoice_id_idx ON public.invoice_line_items(invoice_id);
CREATE INDEX payments_invoice_id_idx ON public.payments(invoice_id);
CREATE INDEX users_role_idx ON public.users(role);

CREATE OR REPLACE FUNCTION public.current_app_role()
RETURNS public.user_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT role FROM public.users WHERE auth_id = auth.uid() $$;

CREATE OR REPLACE FUNCTION public.current_app_client_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT linked_client_id FROM public.users WHERE auth_id = auth.uid() $$;

CREATE OR REPLACE FUNCTION public.current_app_employee_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT linked_employee_id FROM public.users WHERE auth_id = auth.uid() $$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.current_app_role() IN ('recruiter', 'accounting') $$;

REVOKE ALL ON FUNCTION public.current_app_role() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.current_app_client_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.current_app_employee_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_staff() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_app_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_app_client_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_app_employee_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select_own_or_staff ON public.users
  FOR SELECT TO authenticated
  USING (auth_id = auth.uid() OR public.is_staff());

CREATE POLICY users_update_own ON public.users
  FOR UPDATE TO authenticated
  USING (auth_id = auth.uid())
  WITH CHECK (auth_id = auth.uid());

CREATE POLICY clients_select ON public.clients
  FOR SELECT TO authenticated
  USING (public.is_staff() OR id = public.current_app_client_id());

CREATE POLICY clients_write_staff ON public.clients
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE POLICY employees_select ON public.employees
  FOR SELECT TO authenticated
  USING (public.is_staff() OR id = public.current_app_employee_id());

CREATE POLICY employees_write_staff ON public.employees
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE POLICY placements_select ON public.placements
  FOR SELECT TO authenticated
  USING (
    public.is_staff()
    OR client_id = public.current_app_client_id()
    OR employee_id = public.current_app_employee_id()
  );

CREATE POLICY placements_write_staff ON public.placements
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE POLICY timesheets_select ON public.timesheets
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.placements p
      WHERE p.id = timesheets.placement_id
        AND (
          public.is_staff()
          OR p.client_id = public.current_app_client_id()
          OR p.employee_id = public.current_app_employee_id()
        )
    )
  );

CREATE POLICY timesheets_insert_employee ON public.timesheets
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_staff()
    OR EXISTS (
      SELECT 1 FROM public.placements p
      WHERE p.id = placement_id AND p.employee_id = public.current_app_employee_id()
    )
  );

CREATE POLICY timesheets_update ON public.timesheets
  FOR UPDATE TO authenticated
  USING (
    public.is_staff()
    OR EXISTS (
      SELECT 1 FROM public.placements p
      WHERE p.id = timesheets.placement_id
        AND (
          p.client_id = public.current_app_client_id()
          OR p.employee_id = public.current_app_employee_id()
        )
    )
  )
  WITH CHECK (
    public.is_staff()
    OR EXISTS (
      SELECT 1 FROM public.placements p
      WHERE p.id = timesheets.placement_id
        AND (
          p.client_id = public.current_app_client_id()
          OR p.employee_id = public.current_app_employee_id()
        )
    )
  );

CREATE POLICY invoices_select ON public.invoices
  FOR SELECT TO authenticated
  USING (public.is_staff() OR client_id = public.current_app_client_id());

CREATE POLICY invoices_write_staff ON public.invoices
  FOR ALL TO authenticated
  USING (public.current_app_role() IN ('accounting', 'recruiter'))
  WITH CHECK (public.current_app_role() IN ('accounting', 'recruiter'));

CREATE POLICY invoice_line_items_select ON public.invoice_line_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = invoice_line_items.invoice_id
        AND (public.is_staff() OR i.client_id = public.current_app_client_id())
    )
  );

CREATE POLICY invoice_line_items_write_staff ON public.invoice_line_items
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE POLICY payments_select ON public.payments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = payments.invoice_id
        AND (public.is_staff() OR i.client_id = public.current_app_client_id())
    )
  );

CREATE POLICY payments_write_accounting ON public.payments
  FOR ALL TO authenticated
  USING (public.current_app_role() IN ('accounting', 'recruiter'))
  WITH CHECK (public.current_app_role() IN ('accounting', 'recruiter'));
