-- Journal entries (general ledger postings)
DO $$ BEGIN
  CREATE TYPE public.journal_entry_status AS ENUM ('draft', 'posted', 'void');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  memo text NOT NULL DEFAULT '',
  reference text NOT NULL DEFAULT '',
  status public.journal_entry_status NOT NULL DEFAULT 'draft',
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  posted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.journal_entry_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id uuid NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  line_no int NOT NULL,
  account_code text NOT NULL,
  account_name text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  debit numeric(12,2) NOT NULL DEFAULT 0 CHECK (debit >= 0),
  credit numeric(12,2) NOT NULL DEFAULT 0 CHECK (credit >= 0),
  CONSTRAINT journal_entry_lines_one_side CHECK (NOT (debit > 0 AND credit > 0)),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS journal_entries_date_idx
  ON public.journal_entries(entry_date DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS journal_entry_lines_entry_idx
  ON public.journal_entry_lines(journal_entry_id, line_no);

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entry_lines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS journal_entries_staff_all ON public.journal_entries;
CREATE POLICY journal_entries_staff_all ON public.journal_entries
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS journal_entry_lines_staff_all ON public.journal_entry_lines;
CREATE POLICY journal_entry_lines_staff_all ON public.journal_entry_lines
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

INSERT INTO public.journal_entries (id, entry_date, memo, reference, status, created_by, posted_at, created_at, updated_at)
VALUES
(
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee01',
  CURRENT_DATE - 14,
  'Record Northwind temp billing for prior week',
  'INV-NW-001',
  'posted',
  'a18fd0b3-91e1-4d81-a13a-2c0b78eabd54',
  now() - interval '14 days',
  now() - interval '14 days',
  now() - interval '14 days'
),
(
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee02',
  CURRENT_DATE - 10,
  'Payroll accrual for approved timesheets',
  'PR-2026-W30',
  'posted',
  'a18fd0b3-91e1-4d81-a13a-2c0b78eabd54',
  now() - interval '10 days',
  now() - interval '10 days',
  now() - interval '10 days'
),
(
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee03',
  CURRENT_DATE - 7,
  'Cash receipt from Northwind on open invoice',
  'PMT-NW-014',
  'posted',
  'a18fd0b3-91e1-4d81-a13a-2c0b78eabd54',
  now() - interval '7 days',
  now() - interval '7 days',
  now() - interval '7 days'
),
(
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee04',
  CURRENT_DATE - 3,
  'Office rent for current month',
  'RENT-AUG',
  'posted',
  'a18fd0b3-91e1-4d81-a13a-2c0b78eabd54',
  now() - interval '3 days',
  now() - interval '3 days',
  now() - interval '3 days'
),
(
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee05',
  CURRENT_DATE - 1,
  'Draft adjusting entry for accrued recruiting costs',
  'ADJ-REC',
  'draft',
  'a18fd0b3-91e1-4d81-a13a-2c0b78eabd54',
  NULL,
  now() - interval '1 day',
  now() - interval '1 day'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.journal_entry_lines (id, journal_entry_id, line_no, account_code, account_name, description, debit, credit)
VALUES
('ffffffff-ffff-ffff-ffff-ffffffffff01', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee01', 1, '1200', 'Accounts Receivable', 'Northwind billing', 12500.00, 0),
('ffffffff-ffff-ffff-ffff-ffffffffff02', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee01', 2, '4000', 'Contract Revenue', 'Northwind billing', 0, 12500.00),
('ffffffff-ffff-ffff-ffff-ffffffffff03', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee02', 1, '5100', 'Contract Labor Expense', 'Gross pay accrual', 7200.00, 0),
('ffffffff-ffff-ffff-ffff-ffffffffff04', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee02', 2, '2100', 'Accrued Payroll', 'Gross pay accrual', 0, 7200.00),
('ffffffff-ffff-ffff-ffff-ffffffffff05', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee03', 1, '1000', 'Cash', 'Northwind payment', 8500.00, 0),
('ffffffff-ffff-ffff-ffff-ffffffffff06', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee03', 2, '1200', 'Accounts Receivable', 'Northwind payment', 0, 8500.00),
('ffffffff-ffff-ffff-ffff-ffffffffff07', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee04', 1, '6100', 'Rent Expense', 'August office rent', 3200.00, 0),
('ffffffff-ffff-ffff-ffff-ffffffffff08', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee04', 2, '1000', 'Cash', 'August office rent', 0, 3200.00),
('ffffffff-ffff-ffff-ffff-ffffffffff09', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee05', 1, '5200', 'Recruiting Expense', 'Pending recruiter bonus accrual', 1500.00, 0),
('ffffffff-ffff-ffff-ffff-ffffffffff10', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee05', 2, '2200', 'Accrued Expenses', 'Pending recruiter bonus accrual', 0, 1500.00)
ON CONFLICT (id) DO NOTHING;
