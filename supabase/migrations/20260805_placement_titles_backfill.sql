-- Ensure placement position titles are populated for Client/Accounting contracts.
UPDATE public.placements SET title = 'Warehouse Associate'
WHERE id = '33333333-3333-3333-3333-333333333301';
UPDATE public.placements SET title = 'Logistics Coordinator'
WHERE id = '33333333-3333-3333-3333-333333333302';
UPDATE public.placements SET title = 'Registered Nurse'
WHERE id = '33333333-3333-3333-3333-333333333303';
UPDATE public.placements SET title = 'Assembly Technician'
WHERE id = '33333333-3333-3333-3333-333333333304';
UPDATE public.placements SET title = 'Medical Assistant'
WHERE id = '33333333-3333-3333-3333-333333333305';
UPDATE public.placements SET title = 'Medical Assistant'
WHERE id = '33333333-3333-3333-3333-333333333306';
UPDATE public.placements SET title = 'Dock Lead'
WHERE id = '33333333-3333-3333-3333-333333333307' AND (title IS NULL OR btrim(title) = '');
UPDATE public.placements SET title = 'Forklift Operator'
WHERE id = '33333333-3333-3333-3333-333333333308' AND (title IS NULL OR btrim(title) = '');
UPDATE public.placements SET title = 'Case Manager'
WHERE id = '33333333-3333-3333-3333-333333333309' AND (title IS NULL OR btrim(title) = '');
UPDATE public.placements SET title = 'Staff Accountant'
WHERE id = '33333333-3333-3333-3333-333333333310' AND (title IS NULL OR btrim(title) = '');
UPDATE public.placements SET title = 'IT Support Specialist'
WHERE id = '33333333-3333-3333-3333-333333333311' AND (title IS NULL OR btrim(title) = '');
UPDATE public.placements SET title = 'Inventory Clerk'
WHERE id = '33333333-3333-3333-3333-333333333312' AND (title IS NULL OR btrim(title) = '');
UPDATE public.placements SET title = 'Machine Operator'
WHERE id = '33333333-3333-3333-3333-333333333313' AND (title IS NULL OR btrim(title) = '');
UPDATE public.placements SET title = 'Clinic Coordinator'
WHERE id = '33333333-3333-3333-3333-333333333314' AND (title IS NULL OR btrim(title) = '');
UPDATE public.placements SET title = 'Billing Specialist'
WHERE id = '33333333-3333-3333-3333-333333333315' AND (title IS NULL OR btrim(title) = '');
UPDATE public.placements SET title = 'Operations Supervisor'
WHERE id = '33333333-3333-3333-3333-333333333316' AND (title IS NULL OR btrim(title) = '');
UPDATE public.placements SET title = 'Accounts Payable Analyst'
WHERE id = '33333333-3333-3333-3333-333333333317' AND (title IS NULL OR btrim(title) = '');
UPDATE public.placements SET title = 'Safety Coordinator'
WHERE id = '33333333-3333-3333-3333-333333333318' AND (title IS NULL OR btrim(title) = '');

UPDATE public.placements
SET title = COALESCE(
  NULLIF(btrim(title), ''),
  CASE
    WHEN placement_type = 'permanent' THEN 'Permanent Placement'
    ELSE 'Temporary Assignment'
  END
)
WHERE title IS NULL OR btrim(title) = '';
