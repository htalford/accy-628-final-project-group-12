-- Candidate profile: education + up to 3 previous employments (JSON array).
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS education_background text,
  ADD COLUMN IF NOT EXISTS previous_employments jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.employees.education_background IS
  'Free-text education history for the candidate profile.';
COMMENT ON COLUMN public.employees.previous_employments IS
  'JSON array of up to 3 prior jobs: {company, title, startDate, endDate, description}.';
