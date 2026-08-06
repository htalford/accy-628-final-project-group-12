-- Local mirror: demo Candidate portal → Chad Stefaniak
-- Project: jklrdtzesordhgnxbstp (ACCY 628 - Final Project - Group 12)
-- Applied remotely via Supabase MCP: demo_candidate_chad_stefaniak
--
-- Jordan Lee (22222222-…-201) remains Northwind employee + existing
-- applications/submittals. Demo login candidate@talentquest.demo now
-- links to Chad (22222222-…-219): fresh seeker profile, 2 applications,
-- no placement / timesheets.

INSERT INTO public.employees (
  id,
  first_name,
  last_name,
  email,
  phone,
  employment_type,
  status,
  industry,
  skills,
  years_experience,
  certifications,
  education_background,
  previous_employments,
  resume_text,
  emergency_contact_name,
  emergency_contact_phone
) VALUES (
  '22222222-2222-2222-2222-222222222219',
  'Chad',
  'Stefaniak',
  'chad.stefaniak@example.com',
  '555-0219',
  'temp',
  'active',
  'administrative',
  'Microsoft Office, Data entry, Customer service, Communication, Inventory control, Accounts payable, Help desk / desktop support, Pick / pack, Calendar management, Vendor follow-up',
  '6–9 years',
  'Microsoft Office Specialist, OSHA 10, Forklift certification, BLS / CPR, QuickBooks Certified',
  'Bachelor''s degree — Business Administration. Coursework across operations, accounting basics, and workplace systems.',
  '[
    {
      "company": "Prairie Manufacturing Co.",
      "title": "Operations Coordinator",
      "startDate": "2022-01",
      "endDate": "2025-11",
      "description": "Cross-trained on inventory, vendor follow-up, Excel trackers, and floor support. Reliable across shifts."
    },
    {
      "company": "Summit Health Clinics",
      "title": "Administrative Assistant",
      "startDate": "2019-04",
      "endDate": "2021-12",
      "description": "Front desk, scheduling, patient intake support, and AP invoice routing. Strong customer service."
    },
    {
      "company": "Northwind Logistics",
      "title": "Warehouse Associate",
      "startDate": "2017-06",
      "endDate": "2019-03",
      "description": "Pick/pack, RF scanning, forklift. Flexible and quick to learn new tools."
    }
  ]'::jsonb,
  'Chad Stefaniak — versatile professional with 6–9 years across warehouse, clinic admin, and manufacturing operations. Strong with Microsoft Office, customer service, inventory, light AP support, and help-desk style troubleshooting. Open to temp, contract, or permanent roles in any industry where reliable, cross-trained talent helps the team move faster.',
  'Pat Stefaniak',
  '555-0220'
)
ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  employment_type = EXCLUDED.employment_type,
  status = EXCLUDED.status,
  industry = EXCLUDED.industry,
  skills = EXCLUDED.skills,
  years_experience = EXCLUDED.years_experience,
  certifications = EXCLUDED.certifications,
  education_background = EXCLUDED.education_background,
  previous_employments = EXCLUDED.previous_employments,
  resume_text = EXCLUDED.resume_text,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  updated_at = now();

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

INSERT INTO public.applications (id, job_id, employee_id, status, note, include_profile, cover_letter)
VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa201',
    '81d10d97-3414-48e8-932b-03667fe55621',
    '22222222-2222-2222-2222-222222222219',
    'submitted',
    'Demo: Chad applied — logistics / ops interest',
    true,
    'I am excited to bring cross-trained warehouse and coordination experience to your Logistics Coordinator opening.'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa202',
    '8e213efd-ca40-4341-941e-ac1bdf824caf',
    '22222222-2222-2222-2222-222222222219',
    'submitted',
    'Demo: Chad applied — AP / admin interest',
    true,
    'My admin and light AP background plus strong Excel skills make me a flexible contributor for Accounts Payable Analyst work.'
  )
ON CONFLICT (id) DO UPDATE SET
  job_id = EXCLUDED.job_id,
  employee_id = EXCLUDED.employee_id,
  status = EXCLUDED.status,
  note = EXCLUDED.note,
  include_profile = EXCLUDED.include_profile,
  cover_letter = EXCLUDED.cover_letter,
  updated_at = now();
