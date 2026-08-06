-- Add status to operating expenses (same enum as placement expenses).
ALTER TABLE public.operating_expenses
  ADD COLUMN IF NOT EXISTS status public.expense_status NOT NULL DEFAULT 'approved';

UPDATE public.operating_expenses
SET status = 'approved'
WHERE status IS NULL;
