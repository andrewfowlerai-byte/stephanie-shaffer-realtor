# Stephanie Shaffer: Realtor Website + CRM

One React app, one domain, one Supabase project. A public marketing website for Stephanie Shaffer (a Russell Real Estate Services realtor) plus a private, single-user CRM behind a login. Forked from the ANF CRM template and stripped to single-tenant: no client portal, no roles, no multi-tenancy. Stephanie is the only user.

Built and maintained by Andrew Fowler (ANF Consulting) as the first of a fork-per-client family. Feature work here is meant to flow back into future forks.

Reference that loads only when matching files are touched, in `.claude/rules/`: `source-layout.md` (file map), `supabase-reference.md` (tables and access), `brand.md` (tokens, fonts, logo).

## Stack

- React 19 + TypeScript 6 + Vite 8
- Tailwind CSS v3.4 (NOT v4) with @tailwindcss/typography
- Supabase (auth, postgres)
- Vercel (hosting + serverless functions in `/api`)
- React Router v7, lucide-react icons

## Scripts

- `npm run dev`: Vite dev server
- `npm run build`: `tsc -b && vite build` (TS errors fail the build)
- `npm run lint`: ESLint

## Routing model (src/App.tsx)

One SPA, split into a public world and an auth-gated world.

- Public marketing (no auth), wrapped in `MarketingLayout`: `/`, `/about`, `/listings`, `/areas-served`, `/contact`.
- `/login`: the agent sign-in (its own chrome).
- Everything else goes to `CrmApp`, gated on a Supabase session, redirecting to `/login` when there isn't one. CRM routes: `/dashboard`, `/contacts`, `/calendar`, `/follow-ups`, `/settings`.

No roles. Auth is a single Supabase email/password user. Note `/contact` (public form) vs `/contacts` (CRM list).

## Conventions (hard rules)

- No em-dashes anywhere in copy. Use periods, commas, colons, or parens.
- No "boutique". Ever.
- Brand voice for Stephanie: warm, professional, locally rooted.
- Never share Supabase, Twilio, or any secret in chat. Reference env var names. Secrets live in `.env` (gitignored) and Vercel.
- Mobile first. Every page usable on a phone.
- Times pinned to America/New_York.
- Build gates the deploy. `tsc -b` runs in `npm run build`; unused vars and type errors block. Clean before pushing.

## Status

- Done: Sprint 1 (fork, strip, dual-layout routing, single-user auth, brokerage rebrand) and CRM core (categories + bulk tagging, CSV/vCard import, birthdays and home anniversaries, follow-up cadence, AI email + text drafts in her voice).
- Next: Sprint 2 (marketing site content + SEO). Then outbound sending (Twilio SMS needs an A2P 10DLC registration; email needs the domain verified in Resend) and Google Contacts sync (needs a Google Cloud OAuth app). CSV/vCard import covers contacts until then.

## Working in this repo

- Ask before destructive moves (force pushes, schema drops).
- TypeScript strict; fix unused-var errors before pushing.
- Add migrations by incrementing the number; keep them additive.
