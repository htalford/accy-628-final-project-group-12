-- Ensure every active staffed placement has benefits, approve benefits for GL,
-- and post journal entries to 5400 Employee Benefits Expense.

-- 1) Backfill missing benefits for active placements (~10% of seeded monthly pay = pay_rate * 12)
INSERT INTO public.expenses (
  placement_id,
  expense_type,
  description,
  amount,
  expense_date,
  status
)
SELECT
  p.id,
  'benefits'::public.expense_type,
  'Benefits allocation (~10% of seeded pay)',
  round((p.pay_rate * 12)::numeric, 2),
  date_trunc('month', current_date)::date,
  'approved'::public.expense_status
FROM public.placements p
WHERE p.status = 'active'
  AND p.pay_rate IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.expenses e
    WHERE e.placement_id = p.id
      AND e.expense_type = 'benefits'
  );

-- Permanent placements (no hourly pay rate): flat benefits from fee
INSERT INTO public.expenses (
  placement_id,
  expense_type,
  description,
  amount,
  expense_date,
  status
)
SELECT
  p.id,
  'benefits'::public.expense_type,
  'Benefits allocation for permanent placement',
  round((coalesce(p.placement_fee, 0) * 0.02)::numeric, 2),
  date_trunc('month', current_date)::date,
  'approved'::public.expense_status
FROM public.placements p
WHERE p.status = 'active'
  AND p.placement_type = 'permanent'
  AND coalesce(p.placement_fee, 0) > 0
  AND NOT EXISTS (
    SELECT 1
    FROM public.expenses e
    WHERE e.placement_id = p.id
      AND e.expense_type = 'benefits'
  );

-- 2) Approve existing benefits so they are recognized in payroll / P&L
UPDATE public.expenses
SET status = 'approved'
WHERE expense_type = 'benefits'
  AND status = 'pending';

-- 3) Post journal entries for benefits that do not yet have a linked JE
INSERT INTO public.journal_entries (
  entry_date,
  memo,
  reference,
  status,
  source_type,
  source_id,
  posted_at
)
SELECT
  e.expense_date,
  'Placement expense — benefits',
  'expense:' || e.id::text,
  'posted'::public.journal_entry_status,
  'expense'::public.journal_entry_source_type,
  e.id,
  now()
FROM public.expenses e
WHERE e.expense_type = 'benefits'
  AND e.status IN ('approved', 'reimbursed')
  AND NOT EXISTS (
    SELECT 1
    FROM public.journal_entries je
    WHERE je.source_type = 'expense'
      AND je.source_id = e.id
  );

INSERT INTO public.journal_entry_lines (
  journal_entry_id,
  line_no,
  account_code,
  account_name,
  description,
  debit,
  credit
)
SELECT
  je.id,
  1,
  '5400',
  'Employee Benefits Expense',
  coalesce(e.description, 'Employee benefits'),
  e.amount,
  0
FROM public.journal_entries je
JOIN public.expenses e ON e.id = je.source_id
WHERE je.source_type = 'expense'
  AND e.expense_type = 'benefits'
  AND NOT EXISTS (
    SELECT 1 FROM public.journal_entry_lines jel WHERE jel.journal_entry_id = je.id
  );

INSERT INTO public.journal_entry_lines (
  journal_entry_id,
  line_no,
  account_code,
  account_name,
  description,
  debit,
  credit
)
SELECT
  je.id,
  2,
  '2200',
  'Accrued Expenses',
  coalesce(e.description, 'Employee benefits'),
  0,
  e.amount
FROM public.journal_entries je
JOIN public.expenses e ON e.id = je.source_id
WHERE je.source_type = 'expense'
  AND e.expense_type = 'benefits'
  AND (
    SELECT count(*) FROM public.journal_entry_lines jel WHERE jel.journal_entry_id = je.id
  ) = 1;
