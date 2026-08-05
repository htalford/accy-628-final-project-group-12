-- Scope candidate↔staff chat by counterpart role so each portal
-- only sees messages exchanged with that role.

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS counterpart_role text;

ALTER TABLE public.messages
  DROP CONSTRAINT IF EXISTS messages_counterpart_role_check;

ALTER TABLE public.messages
  ADD CONSTRAINT messages_counterpart_role_check
  CHECK (
    counterpart_role IS NULL
    OR counterpart_role IN ('recruiter', 'accounting', 'system')
  );

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS staff_is_read boolean NOT NULL DEFAULT false;

-- Backfill existing rows.
UPDATE public.messages
SET counterpart_role = CASE
  WHEN sender_role = 'accounting' THEN 'accounting'
  WHEN sender_role = 'system' OR lower(sender_name) LIKE '%desk%' THEN 'system'
  ELSE 'recruiter'
END
WHERE counterpart_role IS NULL;

UPDATE public.messages
SET staff_is_read = true
WHERE sender_role IN ('recruiter', 'accounting', 'system');

UPDATE public.messages
SET staff_is_read = false
WHERE sender_role = 'candidate';

CREATE INDEX IF NOT EXISTS messages_counterpart_role_idx
  ON public.messages(counterpart_role);

CREATE INDEX IF NOT EXISTS messages_employee_counterpart_idx
  ON public.messages(employee_id, counterpart_role);
