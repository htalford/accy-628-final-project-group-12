# ACCY 628 Final Project — Group 12

Next.js (App Router + TypeScript) app wired to Supabase and ready for Vercel.

## Stack

- **Next.js** (App Router) + TypeScript + Tailwind CSS
- **Supabase** (`@supabase/ssr` + `@supabase/supabase-js`)
- **Vercel** (zero-config Next.js deploy)

## Supabase project

| | |
|---|---|
| Name | ACCY 628 - Final Project - Group 12 |
| Project ref | `jklrdtzesordhgnxbstp` |
| URL | `https://jklrdtzesordhgnxbstp.supabase.co` |

## Getting started

```bash
npm install
cp .env.example .env.local   # if .env.local is missing
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Supabase clients

| File | Use |
|---|---|
| `lib/supabase/client.ts` | Client Components (browser) |
| `lib/supabase/server.ts` | Server Components, Server Actions, Route Handlers |
| `lib/supabase/proxy.ts` + `proxy.ts` | Refresh auth session cookies on each request |

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import the repo in [Vercel](https://vercel.com/new).
3. Set environment variables (same names as `.env.example`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. Deploy. Vercel detects Next.js automatically (no `vercel.json` required).

Or from the CLI:

```bash
npx vercel
```
