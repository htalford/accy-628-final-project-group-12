-- Local mirror: extend operating_expense_category for teammate categories + seed rows
-- Project: jklrdtzesordhgnxbstp (ACCY 628 - Final Project - Group 12)
-- Applied remotely via Supabase MCP (do not re-apply on production unless needed).

ALTER TYPE public.operating_expense_category ADD VALUE IF NOT EXISTS 'recruiter_labor';
ALTER TYPE public.operating_expense_category ADD VALUE IF NOT EXISTS 'advertising';
ALTER TYPE public.operating_expense_category ADD VALUE IF NOT EXISTS 'background_checks';
ALTER TYPE public.operating_expense_category ADD VALUE IF NOT EXISTS 'drug_screening';
ALTER TYPE public.operating_expense_category ADD VALUE IF NOT EXISTS 'payroll';
ALTER TYPE public.operating_expense_category ADD VALUE IF NOT EXISTS 'employee_wages';
ALTER TYPE public.operating_expense_category ADD VALUE IF NOT EXISTS 'referral_bonuses';
ALTER TYPE public.operating_expense_category ADD VALUE IF NOT EXISTS 'training';

-- Seed sample rows for newly added categories (idempotent-ish: skip if description exists)
INSERT INTO public.operating_expenses (category, description, amount, expense_date, month)
SELECT v.category::public.operating_expense_category, v.description, v.amount, v.expense_date::date, v.month::date
FROM (VALUES
  ('advertising', 'LinkedIn + Indeed campaign — August', 1850.00, '2026-08-01', '2026-08-01'),
  ('background_checks', 'Pre-employment screens (batch)', 420.00, '2026-08-03', '2026-08-01'),
  ('referral_bonuses', 'Employee referral bonus — Q3', 1000.00, '2026-07-15', '2026-07-01'),
  ('training', 'Compliance & interview skills workshop', 750.00, '2026-07-22', '2026-07-01')
) AS v(category, description, amount, expense_date, month)
WHERE NOT EXISTS (
  SELECT 1 FROM public.operating_expenses oe
  WHERE oe.description = v.description
);
