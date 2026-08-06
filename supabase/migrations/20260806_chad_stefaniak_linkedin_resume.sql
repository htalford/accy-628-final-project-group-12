-- Local mirror: Chad Stefaniak LinkedIn-tailored resume + profile
-- Project: jklrdtzesordhgnxbstp
-- Applied remotely via Supabase MCP: chad_stefaniak_linkedin_resume
--
-- Resume PDF lives in the app at public/resumes/Chad_Stefaniak_Resume.pdf
-- (served as /resumes/Chad_Stefaniak_Resume.pdf). No external profile URL stored.

UPDATE public.employees
SET
  industry = 'finance-accounting',
  years_experience = '10+ years',
  employment_type = 'permanent',
  phone = '555-0219',
  skills = 'Auditing, Audit judgment & decision-making, Internal controls, IT audit / AIS, Professional skepticism, Assurance quality, Data analytics, Financial reporting, Excel / financial modeling, Audit support, General ledger, Month-end close',
  certifications = 'CPA',
  education_background = 'Ph.D., Accounting — University of Alabama (2009); M.A.C., Accounting — University of Alabama (2003); B.S., Accounting — Central Michigan University (2002)',
  previous_employments = '[
    {
      "company": "University of Mississippi — Patterson School of Accountancy",
      "title": "Associate Professor",
      "startDate": "2025-06",
      "endDate": "Present",
      "description": "Teaching and research in auditing and data analytics; doctoral mentorship and curriculum contribution."
    },
    {
      "company": "University of South Carolina",
      "title": "Professor; Associate Professor",
      "startDate": "2016-06",
      "endDate": "2025-08",
      "description": "Graduate auditing / IT audit teaching in the MACC program; extensive research publications; AAA Auditing Section leadership."
    },
    {
      "company": "Central Michigan University",
      "title": "Associate Professor and Department Chair",
      "startDate": "2013-06",
      "endDate": "2016-05",
      "description": "Department leadership alongside teaching and research in auditing and assurance."
    },
    {
      "company": "Oklahoma State University",
      "title": "Assistant Professor",
      "startDate": "2009-06",
      "endDate": "2013-05",
      "description": "Research in auditor judgment and decision-making; undergraduate and graduate teaching."
    },
    {
      "company": "EY — Greater Detroit Area",
      "title": "Senior Auditor (IT Audit focus)",
      "startDate": "2001-05",
      "endDate": "2005-06",
      "description": "Assurance and IT audit engagements; internal control evaluation and evidence testing in public accounting."
    }
  ]'::jsonb,
  resume_url = '/resumes/Chad_Stefaniak_Resume.pdf',
  resume_text = $resume$
Chad M. Stefaniak, Ph.D., CPA
Oxford, Mississippi | chad.stefaniak@example.com | 555-0219
Accounting · Auditing · Assurance · Data Analytics · Academic Leadership

PROFESSIONAL SUMMARY
Associate Professor of Accountancy and licensed CPA with nearly 25 years of experience spanning public accounting and higher education. Former Senior / IT Auditor at EY (Detroit) with deep expertise in audit judgment and decision-making, audit quality, assurance credibility, and the behavioral and regulatory forces that shape auditor performance. Widely published researcher and disciplinary leader who brings practitioner insight, doctoral mentorship, and classroom excellence to evolving assurance and analytics environments.

PROFESSIONAL EXPERIENCE
Associate Professor — University of Mississippi, Patterson School of Accountancy (Jun 2025 – Present)
Professor; Associate Professor — University of South Carolina (Jun 2016 – Aug 2025)
Associate Professor and Department Chair — Central Michigan University (Jun 2013 – May 2016)
Assistant Professor — Oklahoma State University (Jun 2009 – May 2013)
Ph.D. Student — University of Alabama (Jun 2005 – May 2009)
Senior Auditor (IT Audit focus) — EY, Greater Detroit Area (May 2001 – Jun 2005)

EDUCATION
Ph.D., Accounting — University of Alabama (2009)
M.A.C., Accounting — University of Alabama (2003)
B.S., Accounting — Central Michigan University (2002)

LICENSES
Certified Public Accountant (CPA) — State of Michigan

SKILLS
Auditing; Audit judgment & decision-making; Internal controls; IT audit / AIS; Professional skepticism; Assurance quality; PCAOB / regulatory oversight; Data analytics; Financial reporting; Research methods; Graduate teaching; Doctoral mentorship; Expert consulting / expert witness support; Academic leadership

LEADERSHIP
President, American Accounting Association — Auditing Section (2024–2025). Editorial board experience with Auditing: A Journal of Practice & Theory, Accounting Horizons, and Accounting Open.
$resume$,
  updated_at = now()
WHERE id = '22222222-2222-2222-2222-222222222219';
