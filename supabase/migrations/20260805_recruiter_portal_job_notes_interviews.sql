-- Recruiter portal: job notes + interview scheduling fields on applications
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS recruiter_notes jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS assigned_employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL;

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS interview_at timestamptz,
  ADD COLUMN IF NOT EXISTS interview_type text,
  ADD COLUMN IF NOT EXISTS interview_notes text;
