# TalentQuest · ACCY 628 Final Project — Group 12

Next.js (App Router + TypeScript) contract-to-cash app for a staffing agency, wired to Supabase and ready for Vercel.

## Stack

- **Next.js** (App Router) + TypeScript + Tailwind CSS + Lucide icons
- **Supabase** Auth + Postgres (RLS) — project `jklrdtzesordhgnxbstp`
- **Vercel**-friendly env vars (no special `vercel.json` required)

## Product

**TalentQuest** tracks placements (temp + permanent), timesheets, invoices, and payments across four roles: employer, candidate, recruiter, accounting.

### Billing rules (for invoice generation)

When building invoice-generation logic, follow these rules:

- **Regular hours** bill at the placement `bill_rate`.
- **Overtime hours** bill to the client at **1.5 × `bill_rate`** (not the flat regular rate).
- Invoice `amount` must equal the sum of its `invoice_line_items.amount` values exactly.
- Temp margin / profitability uses `bill_rate − pay_rate` on regular hours; OT premium is a client billing concept (do not assume the same 1.5× applies to `pay_rate` unless product later defines it).

## Getting started

```bash
npm install
cp .env.example .env.local   # if needed; fill publishable key + DEMO_PASSWORD
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo logins

Password for all: `DemoPass123!`

| Role | Email |
|---|---|
| Employer | `employer@talentquest.demo` |
| Candidate | `candidate@talentquest.demo` |
| Recruiter | `recruiter@talentquest.demo` |
| Accounting | `accounting@talentquest.demo` |

After login, use the **Demo role switcher** (bottom-right) to jump between roles without typing credentials again.

### Role routes

| Role | Pages |
|---|---|
| Employer (Client Portal) | `/client/dashboard`, `/client/job-requests`, `/client/candidates`, `/client/employees`, `/client/contracts`, `/client/timesheets`, `/client/invoices`, `/client/messages`, `/client/profile` |
| Candidate | `/candidate/dashboard`, `/candidate/timesheets` |
| Recruiter | `/recruiter/dashboard`, `/recruiter/placements` |
| Accounting | `/accounting/dashboard`, `/accounting/invoices` |

Legacy `/employer/*` paths redirect to `/client/*`.

## Supabase

| | |
|---|---|
| Name | ACCY 628 - Final Project - Group 12 |
| Project ref | `jklrdtzesordhgnxbstp` |
| URL | `https://jklrdtzesordhgnxbstp.supabase.co` |

Tables (RLS enabled): `clients`, `employees`, `placements`, `timesheets`, `invoices`, `invoice_line_items`, `payments`, `users`.

### Clients

| File | Use |
|---|---|
| `lib/supabase/client.ts` | Client Components |
| `lib/supabase/server.ts` | Server Components / Actions |
| `lib/supabase/proxy.ts` + `proxy.ts` | Session refresh + auth/role gates |

## Deploy to Vercel

1. Push the repo to GitHub.
2. Import in [Vercel](https://vercel.com/new).
3. Set env vars from `.env.example` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `DEMO_PASSWORD`).
4. Deploy.
