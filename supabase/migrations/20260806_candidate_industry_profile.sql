-- Candidate industry-driven profile checklist fields.
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS industry text,
  ADD COLUMN IF NOT EXISTS skills text,
  ADD COLUMN IF NOT EXISTS years_experience text;

COMMENT ON COLUMN public.employees.industry IS
  'Industry slug from marketing industries (e.g. finance-accounting).';
COMMENT ON COLUMN public.employees.skills IS
  'Comma-separated skill tags selected on the candidate profile.';
COMMENT ON COLUMN public.employees.years_experience IS
  'Selected years-of-experience range label from the profile checklist.';
