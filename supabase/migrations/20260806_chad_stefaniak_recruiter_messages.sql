-- Local mirror: recruiter inbox messages for Chad Stefaniak
-- Project: jklrdtzesordhgnxbstp
-- Applied remotely via Supabase MCP: chad_stefaniak_recruiter_messages

INSERT INTO public.messages (
  id,
  employee_id,
  sender_name,
  sender_role,
  counterpart_role,
  subject,
  body,
  is_read,
  staff_is_read,
  created_at
) VALUES
(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb201',
  '22222222-2222-2222-2222-222222222219',
  'Morgan Recruiter',
  'recruiter',
  'recruiter',
  'Welcome to TalentQuest — next steps',
  'Hi Chad — welcome aboard. I reviewed your profile and resume (Ph.D., CPA, and EY audit background stand out). Browse open roles anytime, keep your applications updated, and reply here if you want help targeting Staff Accountant or AP Analyst opportunities. Looking forward to working with you.

— Morgan Recruiter',
  false,
  true,
  now() - interval '2 days'
),
(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb202',
  '22222222-2222-2222-2222-222222222219',
  'Morgan Recruiter',
  'recruiter',
  'recruiter',
  'Following up on your Accounts Payable Analyst application',
  'Hi Chad — thanks for applying to the Accounts Payable Analyst role (Chicago hybrid). Your audit and controls experience is a strong fit for clients who want rigor in payables. Are you open to a short intro call this week to talk timeline and compensation expectations?

— Morgan Recruiter',
  false,
  true,
  now() - interval '5 hours'
)
ON CONFLICT (id) DO UPDATE SET
  employee_id = EXCLUDED.employee_id,
  sender_name = EXCLUDED.sender_name,
  sender_role = EXCLUDED.sender_role,
  counterpart_role = EXCLUDED.counterpart_role,
  subject = EXCLUDED.subject,
  body = EXCLUDED.body,
  is_read = EXCLUDED.is_read,
  staff_is_read = EXCLUDED.staff_is_read;
