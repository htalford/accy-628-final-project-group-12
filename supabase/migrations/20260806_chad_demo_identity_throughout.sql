-- Make Chad Stefaniak the consistent demo candidate identity app-wide.
-- Jordan Lee stays Northwind placed employee (placements/timesheets/invoices).
-- Applied remotely: chad_demo_identity_throughout

UPDATE public.users
SET
  name = 'Chad Stefaniak',
  linked_employee_id = '22222222-2222-2222-2222-222222222219',
  updated_at = now()
WHERE email = 'candidate@talentquest.demo'
  AND role = 'candidate';

UPDATE auth.users
SET raw_user_meta_data =
  coalesce(raw_user_meta_data, '{}'::jsonb)
  || jsonb_build_object('name', 'Chad Stefaniak', 'full_name', 'Chad Stefaniak')
WHERE email = 'candidate@talentquest.demo';

INSERT INTO public.job_interests (id, job_id, employee_id)
VALUES
  (
    'cccccccc-cccc-cccc-cccc-ccccccccc201',
    '81d10d97-3414-48e8-932b-03667fe55621',
    '22222222-2222-2222-2222-222222222219'
  ),
  (
    'cccccccc-cccc-cccc-cccc-ccccccccc202',
    '8e213efd-ca40-4341-941e-ac1bdf824caf',
    '22222222-2222-2222-2222-222222222219'
  )
ON CONFLICT DO NOTHING;

INSERT INTO public.employer_candidate_likes (client_id, application_id)
SELECT
  '11111111-1111-1111-1111-111111111101',
  a.id
FROM public.applications a
WHERE a.id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa202'
ON CONFLICT DO NOTHING;
