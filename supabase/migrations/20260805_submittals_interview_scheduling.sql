-- Recruiter calendar: structured interview fields on employer submittals
ALTER TABLE public.submittals
  ADD COLUMN IF NOT EXISTS interview_at timestamptz,
  ADD COLUMN IF NOT EXISTS interview_type text;
