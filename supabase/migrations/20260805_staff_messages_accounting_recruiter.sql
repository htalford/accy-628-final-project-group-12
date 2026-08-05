-- Staff-to-staff messaging (accounting ↔ recruiter)
CREATE TABLE IF NOT EXISTS public.staff_message_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL DEFAULT 'Staff conversation',
  accounting_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  recruiter_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.staff_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.staff_message_threads(id) ON DELETE CASCADE,
  sender_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  sender_role text NOT NULL CHECK (sender_role IN ('recruiter', 'accounting')),
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS staff_messages_thread_idx
  ON public.staff_messages(thread_id, created_at);

ALTER TABLE public.staff_message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS staff_threads_select ON public.staff_message_threads;
CREATE POLICY staff_threads_select ON public.staff_message_threads
  FOR SELECT TO authenticated
  USING (public.is_staff());

DROP POLICY IF EXISTS staff_threads_insert ON public.staff_message_threads;
CREATE POLICY staff_threads_insert ON public.staff_message_threads
  FOR INSERT TO authenticated
  WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS staff_threads_update ON public.staff_message_threads;
CREATE POLICY staff_threads_update ON public.staff_message_threads
  FOR UPDATE TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS staff_messages_select ON public.staff_messages;
CREATE POLICY staff_messages_select ON public.staff_messages
  FOR SELECT TO authenticated
  USING (public.is_staff());

DROP POLICY IF EXISTS staff_messages_insert ON public.staff_messages;
CREATE POLICY staff_messages_insert ON public.staff_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_staff()
    AND sender_user_id IN (
      SELECT id FROM public.users WHERE auth_id = auth.uid()
    )
  );

INSERT INTO public.staff_message_threads (
  id, subject, accounting_user_id, recruiter_user_id, created_at, updated_at
) VALUES (
  'dddddddd-dddd-dddd-dddd-dddddddddd01',
  'Invoice timing for Northwind',
  'a18fd0b3-91e1-4d81-a13a-2c0b78eabd54',
  '300ea75a-4f1e-472b-b5c0-146b084584ac',
  now() - interval '2 days',
  now() - interval '1 hour'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.staff_messages (id, thread_id, sender_user_id, sender_role, body, created_at) VALUES
(
  'dddddddd-dddd-dddd-dddd-dddddddddd11',
  'dddddddd-dddd-dddd-dddd-dddddddddd01',
  '300ea75a-4f1e-472b-b5c0-146b084584ac',
  'recruiter',
  'Can we invoice Northwind for last week? Timesheets are approved.',
  now() - interval '2 days'
),
(
  'dddddddd-dddd-dddd-dddd-dddddddddd12',
  'dddddddd-dddd-dddd-dddd-dddddddddd01',
  'a18fd0b3-91e1-4d81-a13a-2c0b78eabd54',
  'accounting',
  'Yes — I will generate the invoice after AR review.',
  now() - interval '1 day'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.messages (id, employee_id, sender_name, sender_role, subject, body, is_read, created_at)
VALUES (
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee01',
  '22222222-2222-2222-2222-222222222201',
  'Avery Accounting',
  'accounting',
  'Overtime pay confirmation',
  'Yes — approved overtime will appear on this week''s payroll if your timesheet is approved before the cutoff.',
  false,
  now() - interval '6 hours'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.client_messages (id, thread_id, sender_role, body, created_at)
VALUES (
  'ffffffff-ffff-ffff-ffff-ffffffffff01',
  'cccccccc-cccc-cccc-cccc-cccccccccc02',
  'staff',
  'Thanks — we will mark invoice INV-5501 paid when your Friday payment posts.',
  now() - interval '3 hours'
)
ON CONFLICT (id) DO NOTHING;

UPDATE public.client_message_threads
SET updated_at = now() - interval '3 hours'
WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccc02';
