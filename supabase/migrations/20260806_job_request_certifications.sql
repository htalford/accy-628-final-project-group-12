-- Required certifications on job requests (parallel to skills) for match scoring.
ALTER TABLE public.job_requests
  ADD COLUMN IF NOT EXISTS certifications text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.job_requests.certifications IS
  'Required certifications for automated job↔candidate matching.';

UPDATE public.job_requests
SET
  certifications = CASE title
    WHEN 'Accounts Payable Analyst' THEN
      ARRAY['QuickBooks Certified', 'Excel Specialist']
    WHEN 'Staff Accountant' THEN
      ARRAY['CPA', 'CPA candidate']
    WHEN 'Accounting' THEN
      ARRAY['QuickBooks Certified', 'Bookkeeping Certificate']
    WHEN 'Warehouse Associate' THEN
      ARRAY['OSHA Forklift', 'OSHA 10']
    WHEN 'Logistics Coordinator' THEN
      ARRAY['Hazmat Awareness', 'TMS Certification']
    ELSE ARRAY[]::text[]
  END,
  updated_at = now()
WHERE title IN (
  'Accounts Payable Analyst',
  'Staff Accountant',
  'Accounting',
  'Warehouse Associate',
  'Logistics Coordinator'
);

-- Demo candidate Jordan Lee: AP-aligned certifications (separate from skill tags).
UPDATE public.employees
SET
  certifications =
    'QuickBooks Certified, Excel Specialist, Accounts Payable, Invoice processing, Vendor management, QuickBooks',
  updated_at = now()
WHERE id = '22222222-2222-2222-2222-222222222201';
