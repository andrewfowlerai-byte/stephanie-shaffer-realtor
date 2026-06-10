# Stephanie Shaffer: Realtor Website + CRM

One React app, one domain, one Supabase project. A public marketing website for Stephanie Shaffer (a Coldwell Banker realtor) plus a private, single-user CRM behind a login. Forked from the ANF CRM template and stripped to single-tenant: no client portal, no roles, no multi-tenancy. Stephanie is the only user.

Built and maintained by Andrew Fowler (ANF Consulting) as the first of a fork-per-client family. Feature work here is meant to flow back into future forks.

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

## Where things live

```
src/
  pages/
    Dashboard.tsx          CRM home: stat cards, daily tasks, suggested follow-ups, today's schedule
    Contacts.tsx           contact list: category filter, bulk tagging, import, AI draft, log touch
    Calendar.tsx           month view + recurring events (exports EventFormModal)
    FollowUps.tsx          "who to reach out to today" from the realtor cadence engine
    Settings.tsx           push notifications + sign out
    marketing/             Home, About, Listings, AreasServed, Contact (Sprint 1 scaffolds)
  components/
    Layout.tsx             CRM shell + sidebar
    Login.tsx              agent sign-in (redirects to /dashboard when authed)
    ContactModal.tsx       add/edit a contact (realtor fields + categories)
    ImportContacts.tsx     CSV / vCard import modal
    DraftModal.tsx         AI email/text drafting in Stephanie's voice
    DailyTasks.tsx, SuggestedFollowups.tsx, NotificationsToggle.tsx, LocationAutocomplete.tsx
    marketing/             MarketingLayout, Header, Footer, ScrollToTop
  lib/
    supabase.ts            client + signIn/signOut
    types.ts               Contact, Category, Stage, Tier, Platform, Service
    constants.ts           CATEGORIES, CATEGORY_COLORS, SOURCES
    followups.ts           realtor cadence engine (birthdays, anniversaries, lead/sphere/referral)
    draft.ts               client helper that calls /api/draft-email
    importContacts.ts      CSV + vCard parsing, dedupe, bulk insert
    leads.ts               public website lead capture (inserts a Lead-tagged Prospect)
    calendarEvents.ts, dailyTasks.ts, push.ts, dateLabels.ts
  hooks/
    useContacts.ts (exposes refresh), useLocalDraft.ts, useSearchParamState.ts
api/                       draft-email (email + text), check-reminders (cron), save-push-subscription
supabase/migrations/       0001_initial_schema.sql, 0002_realtor_contact_fields.sql
```

## Supabase

Single-tenant project. Tables (see `supabase/migrations/`):

- `contacts`: leads, sphere, clients. Realtor fields: `categories` (Buyer/Seller/Past Client/Sphere/Lead/Referral/Vendor), `birthday`, `closing_anniversary`, `last_contacted_at`, `address`. Authenticated users have full access; the public website (anon) may INSERT leads only (Prospect + `website-*` source).
- `calendar_events`, `reminders`, `push_subscriptions`, `daily_tasks`: owner-scoped to the single user (`user_id = auth.uid()`).

After applying the migrations, add Stephanie's single auth user in the Supabase dashboard. See `SETUP.md`.

## Brand

Coldwell Banker navy (`midnight`, `brand`) + a warm gold accent (`flame`) + warm greige neutrals (`silver`). The Tailwind token NAMES are kept from the template so every component re-skins from `tailwind.config.js` alone and forks share component code. Only hex values change. Fonts: Fraunces (display) + Inter (body).

## Conventions (hard rules)

- No em-dashes anywhere in copy. Use periods, commas, colons, or parens.
- No "boutique". Ever.
- Brand voice for Stephanie: warm, professional, locally rooted.
- Never share Supabase, Twilio, or any secret in chat. Reference env var names. Secrets live in `.env` (gitignored) and Vercel.
- Mobile first. Every page usable on a phone.
- Times pinned to America/New_York.
- Build gates the deploy. `tsc -b` runs in `npm run build`; unused vars and type errors block. Clean before pushing.

## Sprint status

- Sprint 1 (foundation): done. Fork, strip, dual-layout routing, single-user auth, Coldwell Banker rebrand, initial migration.
- CRM core: done. Realtor categories + bulk tagging, CSV/vCard import, birthday + home-anniversary tracking (migration 0002), realtor follow-up cadence (`lib/followups.ts`), daily "who to reach out to today" (`FollowUps`), AI email + text drafts in her voice (`api/draft-email` + `lib/draft.ts` + `DraftModal`).
- Next: Sprint 2 (marketing site content + SEO). Then outbound sending (Twilio SMS two-way needs an A2P 10DLC registration; email send needs the domain verified in Resend) and Google Contacts one-click sync (needs a Google Cloud OAuth app). CSV/vCard import covers contacts until then.

## Working in this repo

- Ask before destructive moves (force pushes, schema drops).
- TypeScript strict; fix unused-var errors before pushing.
- Add migrations by incrementing the number; keep them additive.
