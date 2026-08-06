-- Demo tuning: required skills that create a clear high vs low match for Jordan Lee,
-- and richer candidate profile signals for skill matching.
-- Low matches (< 60) are auto-flagged for recruiter review in the app layer.

UPDATE public.job_requests
SET
  skills = CASE title
    WHEN 'Accounts Payable Analyst' THEN
      ARRAY[
        'Accounts Payable',
        'Invoice processing',
        'Excel',
        'Vendor management',
        '3-way match',
        'QuickBooks'
      ]
    WHEN 'Staff Accountant' THEN
      ARRAY[
        'CPA',
        'Tax preparation',
        'External audit',
        'ASC 606',
        'Financial modeling',
        'Oracle NetSuite'
      ]
    WHEN 'Accounting' THEN
      ARRAY[
        'Bookkeeping',
        'Excel',
        'Accounts Receivable',
        'QuickBooks',
        'Bank reconciliation'
      ]
    WHEN 'Warehouse Associate' THEN
      ARRAY[
        'Forklift',
        'Pick/pack',
        'Safety',
        'RF scanner',
        'Inventory'
      ]
    WHEN 'Logistics Coordinator' THEN
      ARRAY[
        'TMS',
        'Routing',
        'Freight',
        'Carrier scheduling',
        'Communication'
      ]
    ELSE skills
  END,
  updated_at = now()
WHERE title IN (
  'Accounts Payable Analyst',
  'Staff Accountant',
  'Accounting',
  'Warehouse Associate',
  'Logistics Coordinator'
);

-- Strong AP-aligned profile for demo applicant Jordan Lee (applications exist).
UPDATE public.employees
SET
  certifications =
    'Accounts Payable, Invoice processing, Excel, Vendor management, QuickBooks',
  education_background =
    'B.S. Accounting — State University. Coursework in financial reporting and AP operations.',
  previous_employments = '[
    {
      "company": "Midwest Manufacturing",
      "title": "Accounts Payable Specialist",
      "startDate": "2021-03",
      "endDate": "Present",
      "description": "Vendor invoices, Excel tracking, QuickBooks entry, weekly AP runs."
    },
    {
      "company": "Harbor Retail",
      "title": "AP Clerk",
      "startDate": "2018-06",
      "endDate": "2021-02",
      "description": "Invoice processing and vendor management. Strong time management on month-end payables."
    }
  ]'::jsonb,
  resume_text =
    'Jordan Lee — Accounts Payable specialist with 5+ years invoice processing, Excel, vendor management, and QuickBooks. Comfortable with AP aging and weekly payment runs. Good with time and deadlines. Looking for AP Analyst roles.',
  updated_at = now()
WHERE id = '22222222-2222-2222-2222-222222222201';
