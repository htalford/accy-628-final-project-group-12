-- Set all staff salary operating expenses to $5,000 / month.
-- Also align linked posted journal lines so GL matches Expenses/Payroll.

UPDATE public.operating_expenses
SET amount = 5000.00
WHERE category::text IN ('recruiter_salaries', 'accounting_salaries');

UPDATE public.journal_entry_lines AS jel
SET
  debit = CASE WHEN jel.debit > 0 THEN 5000.00 ELSE 0 END,
  credit = CASE WHEN jel.credit > 0 THEN 5000.00 ELSE 0 END
FROM public.journal_entries AS je
WHERE jel.journal_entry_id = je.id
  AND je.source_type = 'operating_expense'
  AND je.source_id IN (
    SELECT id
    FROM public.operating_expenses
    WHERE category::text IN ('recruiter_salaries', 'accounting_salaries')
  );
