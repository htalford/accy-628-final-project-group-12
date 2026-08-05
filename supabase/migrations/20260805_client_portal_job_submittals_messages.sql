-- Client Portal only: employer job requests, submittals, and client↔ messaging.
-- Does NOT touch public.jobs, public.applications, or public.messages
-- (those serve the job board / candidate portal).

CREATE TYPE public.job_request_status AS ENUM (
  'open',
  'in_progress',
  'filled',
  'closed'
);

CREATE TYPE public.submittal_stage AS ENUM (
  'submitted',
  'under_review',
  'interview',
  'offer',
  'accepted',
  'rejected'
);

CREATE TABLE public.job_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  department text NOT NULL DEFAULT '',
  positions integer NOT NULL DEFAULT 1 CHECK (positions > 0),
  status public.job_request_status NOT NULL DEFAULT 'open',
  employment_type text NOT NULL DEFAULT 'Temporary',
  location text,
  pay_rate_text text,
  start_date date,
  skills text[] NOT NULL DEFAULT '{}',
  description text,
  notes text,
  recruiter_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.submittals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_request_id uuid NOT NULL REFERENCES public.job_requests(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  candidate_name text NOT NULL,
  candidate_email text,
  candidate_phone text,
  position_title text NOT NULL DEFAULT '',
  recruiter_name text,
  years_experience integer,
  stage public.submittal_stage NOT NULL DEFAULT 'submitted',
  resume_status text NOT NULL DEFAULT 'On File',
  skills text[] NOT NULL DEFAULT '{}',
  certifications text[] NOT NULL DEFAULT '{}',
  experience_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  interview_notes text,
  resume_summary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.client_message_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  subject text NOT NULL DEFAULT '',
  recruiter_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.client_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.client_message_threads(id) ON DELETE CASCADE,
  sender_role text NOT NULL CHECK (sender_role IN ('client', 'recruiter', 'staff')),
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX job_requests_client_id_idx ON public.job_requests(client_id);
CREATE INDEX submittals_client_id_idx ON public.submittals(client_id);
CREATE INDEX submittals_job_request_id_idx ON public.submittals(job_request_id);
CREATE INDEX client_message_threads_client_id_idx ON public.client_message_threads(client_id);
CREATE INDEX client_messages_thread_id_idx ON public.client_messages(thread_id);

ALTER TABLE public.job_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submittals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY job_requests_select ON public.job_requests
  FOR SELECT TO authenticated
  USING (public.is_staff() OR client_id = public.current_app_client_id());

CREATE POLICY job_requests_insert_employer ON public.job_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_staff()
    OR (
      public.current_app_role() = 'employer'
      AND client_id = public.current_app_client_id()
    )
  );

CREATE POLICY job_requests_update ON public.job_requests
  FOR UPDATE TO authenticated
  USING (
    public.is_staff()
    OR (
      public.current_app_role() = 'employer'
      AND client_id = public.current_app_client_id()
    )
  )
  WITH CHECK (
    public.is_staff()
    OR (
      public.current_app_role() = 'employer'
      AND client_id = public.current_app_client_id()
    )
  );

CREATE POLICY job_requests_delete_staff ON public.job_requests
  FOR DELETE TO authenticated
  USING (public.is_staff());

CREATE POLICY submittals_select ON public.submittals
  FOR SELECT TO authenticated
  USING (public.is_staff() OR client_id = public.current_app_client_id());

CREATE POLICY submittals_update_employer ON public.submittals
  FOR UPDATE TO authenticated
  USING (
    public.is_staff()
    OR (
      public.current_app_role() = 'employer'
      AND client_id = public.current_app_client_id()
    )
  )
  WITH CHECK (
    public.is_staff()
    OR (
      public.current_app_role() = 'employer'
      AND client_id = public.current_app_client_id()
    )
  );

CREATE POLICY submittals_insert ON public.submittals
  FOR INSERT TO authenticated
  WITH CHECK (public.is_staff() OR client_id = public.current_app_client_id());

CREATE POLICY submittals_delete_staff ON public.submittals
  FOR DELETE TO authenticated
  USING (public.is_staff());

CREATE POLICY client_message_threads_select ON public.client_message_threads
  FOR SELECT TO authenticated
  USING (public.is_staff() OR client_id = public.current_app_client_id());

CREATE POLICY client_message_threads_insert ON public.client_message_threads
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_staff()
    OR (
      public.current_app_role() = 'employer'
      AND client_id = public.current_app_client_id()
    )
  );

CREATE POLICY client_message_threads_update ON public.client_message_threads
  FOR UPDATE TO authenticated
  USING (
    public.is_staff()
    OR client_id = public.current_app_client_id()
  )
  WITH CHECK (
    public.is_staff()
    OR client_id = public.current_app_client_id()
  );

CREATE POLICY client_messages_select ON public.client_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.client_message_threads t
      WHERE t.id = client_messages.thread_id
        AND (public.is_staff() OR t.client_id = public.current_app_client_id())
    )
  );

CREATE POLICY client_messages_insert ON public.client_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.client_message_threads t
      WHERE t.id = client_messages.thread_id
        AND (
          public.is_staff()
          OR (
            public.current_app_role() = 'employer'
            AND t.client_id = public.current_app_client_id()
          )
        )
    )
  );

-- Northwind demo rows only (new tables; no updates to existing seed rows)
INSERT INTO public.job_requests (
  id, client_id, title, department, positions, status, employment_type,
  location, pay_rate_text, start_date, skills, description, notes, recruiter_name
) VALUES
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01',
  '11111111-1111-1111-1111-111111111101',
  'Warehouse Associate',
  'Operations',
  2,
  'in_progress',
  'Temporary',
  'Des Moines, IA',
  '$26–$30 / hr',
  '2026-08-18',
  ARRAY['Forklift', 'Pick/pack', 'Safety'],
  'Support peak freight volume on dock at Northwind Logistics.',
  'Recruiter reviewing Riley Quinn and Priya Shah.',
  'Morgan Recruiter'
),
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02',
  '11111111-1111-1111-1111-111111111101',
  'Logistics Coordinator',
  'Logistics',
  1,
  'open',
  'Contract-to-hire',
  'Des Moines, IA',
  '$32–$38 / hr',
  '2026-09-01',
  ARRAY['TMS', 'Routing', 'Communication'],
  'Coordinate outbound freight and carrier appointments.',
  'Taylor Kim is a strong match for this role.',
  'Morgan Recruiter'
);

INSERT INTO public.submittals (
  id, job_request_id, client_id, employee_id, candidate_name, candidate_email,
  candidate_phone, position_title, recruiter_name, years_experience, stage,
  resume_status, skills, certifications, experience_json, interview_notes, resume_summary
) VALUES
(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01',
  '11111111-1111-1111-1111-111111111101',
  '22222222-2222-2222-2222-222222222208',
  'Riley Quinn',
  'riley.quinn@example.com',
  '555-0108',
  'Warehouse Associate',
  'Morgan Recruiter',
  3,
  'under_review',
  'On File',
  ARRAY['Forklift', 'RF scanners', 'Inventory'],
  ARRAY['OSHA Forklift'],
  '[{"company":"Midwest Fulfillment","title":"Warehouse Associate","years":"2023–2026"}]'::jsonb,
  'Available for second shift at Northwind.',
  'Strong dock experience; submitted for open Warehouse Associate request.'
),
(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02',
  '11111111-1111-1111-1111-111111111101',
  '22222222-2222-2222-2222-222222222209',
  'Taylor Kim',
  'taylor.kim@example.com',
  '555-0109',
  'Logistics Coordinator',
  'Morgan Recruiter',
  6,
  'interview',
  'Updated',
  ARRAY['TMS', 'Routing', 'Customer service'],
  ARRAY[]::text[],
  '[{"company":"ClearPath Transit","title":"Dispatcher","years":"2020–2026"}]'::jsonb,
  'Permanent hire candidate; interview scheduled.',
  'Routing and TMS background for Logistics Coordinator opening.'
),
(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb03',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01',
  '11111111-1111-1111-1111-111111111101',
  '22222222-2222-2222-2222-222222222206',
  'Priya Shah',
  'priya.shah@example.com',
  '555-0106',
  'Warehouse Lead',
  'Morgan Recruiter',
  8,
  'submitted',
  'On File',
  ARRAY['Team lead', 'Safety', 'Cycle counts'],
  ARRAY['OSHA 30'],
  '[{"company":"Prairie Manufacturing Co.","title":"Shift Lead","years":"2018–2026"}]'::jsonb,
  'Leadership profile; may map to Warehouse Associate lead path.',
  'Shift lead experience; newly submitted for review.'
);

INSERT INTO public.client_message_threads (id, client_id, subject, recruiter_name) VALUES
(
  'cccccccc-cccc-cccc-cccc-cccccccccc01',
  '11111111-1111-1111-1111-111111111101',
  'Alex Nguyen placement · margin review',
  'Morgan Recruiter'
),
(
  'cccccccc-cccc-cccc-cccc-cccccccccc02',
  '11111111-1111-1111-1111-111111111101',
  'Invoice payment received · INV-5501',
  'Morgan Recruiter'
);

INSERT INTO public.client_messages (id, thread_id, sender_role, body, created_at) VALUES
(
  'dddddddd-dddd-dddd-dddd-dddddddddd01',
  'cccccccc-cccc-cccc-cccc-cccccccccc01',
  'recruiter',
  'Casey — Alex Nguyen''s placement is flagged at risk because the bill rate is only $2 over pay. Want me to renegotiate?',
  '2026-08-03 15:12:00+00'
),
(
  'dddddddd-dddd-dddd-dddd-dddddddddd02',
  'cccccccc-cccc-cccc-cccc-cccccccccc01',
  'client',
  'Yes — hold that assignment and queue Taylor Kim if the margin cannot improve.',
  '2026-08-03 16:05:00+00'
),
(
  'dddddddd-dddd-dddd-dddd-dddddddddd03',
  'cccccccc-cccc-cccc-cccc-cccccccccc02',
  'recruiter',
  'Thanks for the quick payment on INV-5501 ($2,352) for Jordan Lee''s overtime week.',
  '2026-07-28 14:00:00+00'
);
