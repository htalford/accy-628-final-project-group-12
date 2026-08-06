-- Candidate decisions on application outcomes (offer accept/decline, rejection ack).
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS candidate_decision text,
  ADD COLUMN IF NOT EXISTS candidate_decision_at timestamptz;

ALTER TABLE public.applications
  DROP CONSTRAINT IF EXISTS applications_candidate_decision_check;

ALTER TABLE public.applications
  ADD CONSTRAINT applications_candidate_decision_check
  CHECK (
    candidate_decision IS NULL
    OR candidate_decision IN ('accepted', 'declined', 'acknowledged')
  );

COMMENT ON COLUMN public.applications.candidate_decision IS
  'Candidate response: accepted/declined for offers; acknowledged for employer declines.';
