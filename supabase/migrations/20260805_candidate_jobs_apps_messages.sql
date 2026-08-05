-- Candidate portal: jobs, applications, messages (+ own profile update)
-- Builds on existing clients, employees, placements, timesheets.

CREATE TYPE public.job_status AS ENUM ('open', 'filled', 'closed');
CREATE TYPE public.application_status AS ENUM (
  'submitted',
  'reviewing',
  'interview',
  'offered',
  'rejected',
  'withdrawn'
);

CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  employer_name text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  location text,
  employment_type public.employment_type NOT NULL DEFAULT 'temp',
  pay_rate_min numeric(10, 2),
  pay_rate_max numeric(10, 2),
  status public.job_status NOT NULL DEFAULT 'open',
  posted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  status public.application_status NOT NULL DEFAULT 'submitted',
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT applications_job_employee_uidx UNIQUE (job_id, employee_id)
);

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  sender_name text NOT NULL,
  sender_role text NOT NULL DEFAULT 'recruiter',
  subject text NOT NULL,
  body text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX jobs_status_idx ON public.jobs(status);
CREATE INDEX applications_employee_id_idx ON public.applications(employee_id);
CREATE INDEX applications_job_id_idx ON public.applications(job_id);
CREATE INDEX messages_employee_id_idx ON public.messages(employee_id);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Candidates may update their own employee profile (phone, name fields).
CREATE POLICY employees_update_own ON public.employees
  FOR UPDATE TO authenticated
  USING (id = public.current_app_employee_id())
  WITH CHECK (id = public.current_app_employee_id());

-- Jobs: any authenticated user can read open jobs; staff manage all.
CREATE POLICY jobs_select ON public.jobs
  FOR SELECT TO authenticated
  USING (public.is_staff() OR status = 'open' OR public.current_app_role() = 'candidate');

CREATE POLICY jobs_write_staff ON public.jobs
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- Applications: candidates manage own; staff see all.
CREATE POLICY applications_select ON public.applications
  FOR SELECT TO authenticated
  USING (
    public.is_staff()
    OR employee_id = public.current_app_employee_id()
  );

CREATE POLICY applications_insert_candidate ON public.applications
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_staff()
    OR employee_id = public.current_app_employee_id()
  );

CREATE POLICY applications_update_own_or_staff ON public.applications
  FOR UPDATE TO authenticated
  USING (
    public.is_staff()
    OR employee_id = public.current_app_employee_id()
  )
  WITH CHECK (
    public.is_staff()
    OR employee_id = public.current_app_employee_id()
  );

-- Messages: candidates see/update own inbox; can send (insert) as themselves; staff manage all.
CREATE POLICY messages_select ON public.messages
  FOR SELECT TO authenticated
  USING (
    public.is_staff()
    OR employee_id = public.current_app_employee_id()
  );

CREATE POLICY messages_insert ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_staff()
    OR employee_id = public.current_app_employee_id()
  );

CREATE POLICY messages_update_own_or_staff ON public.messages
  FOR UPDATE TO authenticated
  USING (
    public.is_staff()
    OR employee_id = public.current_app_employee_id()
  )
  WITH CHECK (
    public.is_staff()
    OR employee_id = public.current_app_employee_id()
  );

-- Seed demo jobs from existing clients where available.
INSERT INTO public.jobs (
  client_id,
  employer_name,
  title,
  description,
  location,
  employment_type,
  pay_rate_min,
  pay_rate_max,
  status
)
SELECT
  c.id,
  c.name,
  v.title,
  v.description,
  v.location,
  v.employment_type::public.employment_type,
  v.pay_rate_min,
  v.pay_rate_max,
  'open'::public.job_status
FROM public.clients c
CROSS JOIN LATERAL (
  VALUES
    (
      'Accounts Payable Analyst',
      'Support month-end close and invoice reconciliation for a multi-site employer. Temp-to-perm possible after 13 weeks.',
      'Chicago, IL (hybrid)',
      'temp',
      32.00,
      38.00
    ),
    (
      'Staff Accountant',
      'General ledger, bank reconciliations, and assist with financial reporting packs for leadership.',
      'Remote (US)',
      'temp',
      28.00,
      34.00
    )
) AS v(title, description, location, employment_type, pay_rate_min, pay_rate_max)
WHERE c.status = 'active'
LIMIT 4;

-- If fewer than 2 jobs were inserted (no clients), seed standalone openings.
INSERT INTO public.jobs (
  employer_name,
  title,
  description,
  location,
  employment_type,
  pay_rate_min,
  pay_rate_max,
  status
)
SELECT *
FROM (
  VALUES
    (
      'Northwind Logistics',
      'Payroll Specialist',
      'Process bi-weekly payroll for 200+ contractors; partner with recruiters on rate changes.',
      'Austin, TX',
      'temp'::public.employment_type,
      30.00,
      36.00,
      'open'::public.job_status
    ),
    (
      'Harbor Healthcare',
      'Revenue Cycle Coordinator',
      'Track claim status and follow up on denied claims for ambulatory clinics.',
      'Milwaukee, WI',
      'permanent'::public.employment_type,
      55.00,
      65.00,
      'open'::public.job_status
    )
) AS seed(
  employer_name,
  title,
  description,
  location,
  employment_type,
  pay_rate_min,
  pay_rate_max,
  status
)
WHERE (SELECT count(*) FROM public.jobs) < 2;

-- Seed inbox + optional application for the linked candidate demo user.
INSERT INTO public.messages (employee_id, sender_name, sender_role, subject, body, is_read)
SELECT
  e.id,
  'Morgan Recruiter',
  'recruiter',
  'Welcome to your ContractFlow candidate portal',
  'Hi! Use this portal to browse open roles, track applications, submit timesheets, and review your contracts. Reply here anytime if you need help.',
  false
FROM public.employees e
JOIN public.users u ON u.linked_employee_id = e.id
WHERE u.role = 'candidate'
LIMIT 1;

INSERT INTO public.messages (employee_id, sender_name, sender_role, subject, body, is_read)
SELECT
  e.id,
  'ContractFlow Desk',
  'system',
  'Reminder: submit last week''s timesheet',
  'Your active placement expects hours by Monday 10am. Open Timesheets to enter regular and overtime hours.',
  false
FROM public.employees e
JOIN public.users u ON u.linked_employee_id = e.id
WHERE u.role = 'candidate'
LIMIT 1;

INSERT INTO public.applications (job_id, employee_id, status, note)
SELECT
  j.id,
  e.id,
  'reviewing'::public.application_status,
  'Interested in hybrid accounting roles starting ASAP.'
FROM public.jobs j
CROSS JOIN public.employees e
JOIN public.users u ON u.linked_employee_id = e.id
WHERE u.role = 'candidate'
  AND j.status = 'open'
ORDER BY j.posted_at DESC
LIMIT 1
ON CONFLICT (job_id, employee_id) DO NOTHING;
