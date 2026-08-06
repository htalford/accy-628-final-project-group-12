-- Local mirror: reactivate Blake Turner Northwind placement
-- Project: jklrdtzesordhgnxbstp (ACCY 628 - Final Project - Group 12)
--
-- Blake Turner (22222222-2222-2222-2222-222222222211) already existed as an
-- employee with placement 33333333-3333-3333-3333-333333333308 (Forklift Operator
-- at Northwind), plus timesheets / invoice / expenses. The placement was
-- status=completed with end_date 2026-02-28, so the employer Employees list
-- (active / at_risk only) hid him even though Contracts showed the engagement.
--
-- Applied remotely via Supabase MCP migration: reactivate_blake_turner_placement

UPDATE public.placements
SET
  status = 'active',
  end_date = NULL,
  updated_at = now()
WHERE id = '33333333-3333-3333-3333-333333333308'
  AND employee_id = '22222222-2222-2222-2222-222222222211';

UPDATE public.employees
SET
  status = 'active',
  updated_at = now()
WHERE id = '22222222-2222-2222-2222-222222222211';
