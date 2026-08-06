-- Soften Chad Stefaniak demo resume: keep Ole Miss, 2 fictional prior roles
-- (Navy cryptologic specialist + river outfitter), random traits/skills.
-- PDF: public/resumes/Chad_Stefaniak_Resume.pdf
-- Applied remotely: chad_stefaniak_randomized_resume (+ chad_messages_match_new_resume)

UPDATE public.employees
SET
  industry = 'administrative',
  years_experience = '10+ years',
  employment_type = 'temp',
  skills = 'Microsoft Office, Radio / communications basics, Inventory tracking, Schedule coordination, Customer service, Safety briefings, Data entry, Vendor follow-up, Team leadership, Trip / logistics planning, Basic troubleshooting, Documentation & SOPs',
  certifications = 'OSHA 10, First Aid / CPR, Forklift certification, Secret clearance (inactive), Water Safety Instructor (expired)',
  education_background = 'Bachelor''s degree — Business Administration. Coursework in operations, communications, and workplace systems.',
  previous_employments = '[
    {
      "company": "University of Mississippi — Patterson School of Accountancy",
      "title": "Associate Professor",
      "startDate": "2025-06",
      "endDate": "Present",
      "description": "Teach and mentor students; coordinate materials, office hours, and academic support."
    },
    {
      "company": "U.S. Navy",
      "title": "Cryptologic / Signals Specialist (E-6)",
      "startDate": "2014-08",
      "endDate": "2021-05",
      "description": "Communications and signal systems support; trained juniors; watch schedules; multi-branch coordination under security protocols."
    },
    {
      "company": "Blackwater Drift Co.",
      "title": "River Outfitter & Operations Lead",
      "startDate": "2011-03",
      "endDate": "2014-07",
      "description": "Launch schedules, guest check-in, gear staging, seasonal guide coaching, inventory, and vendor logistics for rafting ops."
    }
  ]'::jsonb,
  resume_url = '/resumes/Chad_Stefaniak_Resume.pdf',
  resume_text = $resume$
Chad Stefaniak
Oxford, Mississippi | chad.stefaniak@example.com | 555-0219
Reliable · Adaptable · Team-first · Calm under pressure

PROFESSIONAL SUMMARY
Versatile professional who moves easily between academic, operational, and high-stakes environments. Known for quick learning, clear communication, and staying steady when plans change. Open to temp, contract, or permanent roles where ownership and follow-through matter.

PROFESSIONAL EXPERIENCE
Associate Professor — University of Mississippi, Patterson School of Accountancy (Jun 2025 – Present)
Cryptologic / Signals Specialist (E-6) — U.S. Navy (Aug 2014 – May 2021)
River Outfitter & Operations Lead — Blackwater Drift Co., Franklin, TN (Mar 2011 – Jul 2014)

EDUCATION
Bachelor's degree — Business Administration

TRAITS
Calm under pressure; Detail-oriented without getting stuck; Hands-on learner; Clear written and verbal communicator; Dependable for early / odd hours; Comfortable with both field work and desk work; Good sense of humor on long days

SKILLS
Microsoft Office; Radio / communications basics; Inventory tracking; Schedule coordination; Customer service; Safety briefings; Data entry; Vendor follow-up; Team leadership; Trip / logistics planning; Basic troubleshooting; Documentation & SOPs

CERTIFICATIONS
OSHA 10; First Aid / CPR; Forklift certification; Secret clearance (inactive); Water Safety Instructor (expired)
$resume$,
  updated_at = now()
WHERE id = '22222222-2222-2222-2222-222222222219';

UPDATE public.messages
SET body = 'Hi Chad — welcome aboard. I reviewed your profile and resume (Ole Miss plus your Navy signals background and operations experience stand out). Browse open roles anytime, keep your applications updated, and reply here if you want help targeting logistics, admin, or accounting-adjacent opportunities. Looking forward to working with you.

— Morgan Recruiter'
WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb201';

UPDATE public.messages
SET body = 'Hi Chad — thanks for applying to the Accounts Payable Analyst role (Chicago hybrid). Your inventory, documentation, and deadline discipline from Navy + ops roles are useful for clients who need reliable payables support. Are you open to a short intro call this week to talk timeline and compensation expectations?

— Morgan Recruiter'
WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb202';
