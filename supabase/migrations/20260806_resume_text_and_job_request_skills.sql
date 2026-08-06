-- Store extracted resume body for automated job matching.
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS resume_text text;

COMMENT ON COLUMN public.employees.resume_text IS
  'Plain text extracted from the candidate resume file for match scoring.';

-- Required skills for each employer job request (demo + live rows).
UPDATE public.job_requests
SET
  skills = CASE
    WHEN title ILIKE '%warehouse%' THEN
      ARRAY['Forklift', 'Pick/pack', 'Safety', 'RF scanner', 'Inventory', 'Shipping']
    WHEN title ILIKE '%logistics%' THEN
      ARRAY['TMS', 'Routing', 'Communication', 'Carrier scheduling', 'Freight', 'Excel']
    WHEN title ILIKE '%accounts payable%' OR title ILIKE '% a/p%' OR title ILIKE '%ap analyst%' THEN
      ARRAY['Accounts Payable', 'Invoice processing', '3-way match', 'Excel', 'SAP', 'Vendor management']
    WHEN title ILIKE '%staff accountant%' THEN
      ARRAY['GAAP', 'Month-end close', 'Reconciliations', 'Financial reporting', 'Excel', 'Journal entries']
    WHEN title ILIKE '%accounting%' THEN
      ARRAY['QuickBooks', 'Excel', 'GAAP', 'Accounts Receivable', 'Journal entries', 'Bookkeeping']
    ELSE
      ARRAY['Communication', 'Microsoft Office', 'Attention to detail', 'Teamwork']
  END,
  updated_at = now()
WHERE skills IS NULL
   OR cardinality(skills) = 0
   OR title IN (
     'Warehouse Associate',
     'Logistics Coordinator',
     'Accounts Payable Analyst',
     'Staff Accountant',
     'Accounting'
   );
