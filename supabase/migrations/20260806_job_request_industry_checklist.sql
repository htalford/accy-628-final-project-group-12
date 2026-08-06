-- Industry checklist fields on employer job requests (aligned with candidate profile).
ALTER TABLE public.job_requests
  ADD COLUMN IF NOT EXISTS industry text,
  ADD COLUMN IF NOT EXISTS years_experience text;

COMMENT ON COLUMN public.job_requests.industry IS
  'Industry slug from shared industry checklist (e.g. finance-accounting).';
COMMENT ON COLUMN public.job_requests.years_experience IS
  'Preferred years-of-experience range label from the shared checklist.';
