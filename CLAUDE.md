# Stephanie Shaffer: Realtor Website + CRM

One React app, one domain, one Supabase project. A public marketing website for Stephanie Shaffer (a Coldwell Banker realtor) plus a private, single-user CRM behind a login. Forked from the ANF CRM template and stripped to single-tenant: no client portal, no roles, no multi-tenancy. Stephanie is the only user.

Built and maintained by Andrew Fowler (ANF Consulting) as the first of a fork-per-client family. Feature work here is meant to flow back into future forks.

## Stack

- React 19 + TypeScript 6 + Vite 8
- Tailwind CSS v3.4 (NOT v4) with @tailwindcss/typography
- Supabase (auth, postgres)
- Vercel (hosting + serverless functions in `/api`)
- React Router v7
- lucide-react icons

## Scripts

- `npm run dev` — Vite dev server
- `npm run build` — `tsc -b && vite build` (TS errors fail the build)
- `npm run lint` — ESLint

## Routing model (src/App.tsx)

One SPA, split into a public world and an auth-gated world.

- **Public marketing** (no auth), wrapped in `MarketingLayout`: `/`, `/about`, `/listings`, `/areas-served`, `/contact`.
- **`/login`** — its own chrome (the agent sign-in).
- **Everything else → `CrmApp`**, which is gated on a Supabase session and redirects to `/login` when there isn't one. CRM routes: `/dashboard`, `/contacts`, `/calendar`, `/follow-ups`, `/settings`.

There are no roles. Auth is a single Supabase email/password user. Note `/contact` (public form) vs `/contacts` (CRM list).

## Where things live

```
src/
  pages/
    Dashboard.tsx          CRM home: stat cards, daily tasks, suggested follow-ups, today's schedule
    Contacts.tsx           contact list with filters, sort, AI email draft, convert/edit/delete
    Calendar.tsx           month view + recurring events (exports EventFormModal)
    FollowUps.tsx          "who to reach out to today" (rule-based suggestions)
    Settings.tsx           push notifications + sign out
    marketing/
      Home, About, Listings, AreasServed, Contact   public pages (Sprint 1 = scaffolds)
  components/
    Layout.tsx             CRM shell + sidebar (Dashboard, Contacts, Follow-ups, Calendar, Settings)
    Login.tsx              agent sign-in (redirects to /dashboard when authed)
    ContactModal.tsx       add/edit a contact
    DailyTasks.tsx         daily checklist card
    SuggestedFollowups.tsx ranked outreach card (uses lib/followups)
    NotificationsToggle.tsx  enable web push
    LocationAutocomplete.tsx Google Places (optional; degrades to plain text)
    marketing/
      MarketingLayout, Header, Footer, ScrollToTop
  lib/
    supabase.ts            client + signIn/signOut
    types.ts               Contact, Stage, Tier, Platform, Service
    constants.ts           STAGES, TIER_DETAILS, etc.
    followups.ts           rule-based follow-up suggester (re-keyed to realtor cadence in Sprint 3)
    leads.ts               public website lead capture (inserts into contacts as a Prospect)
    calendarEvents.ts      event CRUD + recurrence
    dailyTasks.ts          daily_tasks CRUD
    push.ts                web push subscribe/persist
    dateLabels.ts          America/New_York date helpers
  hooks/
    useContacts.ts, useLocalDraft.ts, useSearchParamState.ts
api/                       Vercel functions: draft-email, check-reminders (cron), save-push-subscription
supabase/migrations/       0001_initial_schema.sql (one clean migration)
```

## Supabase

Single-tenant project. Tables (see `supabase/migrations/0001_initial_schema.sql`):

- `contacts` — leads, sphere, clients. Authenticated users have full access; the public website (anon) may INSERT leads only (Prospect + `website-*` source).
- `calendar_events`, `reminders`, `push_subscriptions`, `daily_tasks` — owner-scoped to the single user (`user_id = auth.uid()`).

After applying the migration, add Stephanie's single auth user in the Supabase dashboard. See `SETUP.md` for full provisioning.

## Brand

Coldwell Banker navy (`midnight`, `brand`) + a warm gold accent (`flame`) + warm greige neutrals (`silver`). The Tailwind token NAMES are kept from the template so every component re-skins from `tailwind.config.js` alone and forks share component code. Only hex values change. Fonts: Fraunces (display) + Inter (body). Reads as Coldwell Banker, feels warm and friendly.

## Conventions (hard rules)

- **No em-dashes** anywhere in copy. Use periods, commas, colons, or parens.
- **No "boutique"**. Ever.
- **Brand voice for Stephanie**: warm, professional, locally rooted.
- **Never share Supabase, Twilio, or any secret in chat**. Reference env var names. Secrets live in `.env` (gitignored) and Vercel.
- **Mobile first**. Every page usable on a phone.
- **Times pinned to America/New_York**.
- **Default state**: collapsible panels start closed.
- **Build gates the deploy**. `tsc -b` runs in `npm run build`; unused vars and type errors block. Clean before pushing.

## Sprint status

- **Sprint 1 (foundation) — done**: fork from anf-crm, strip portal/proposals/vault/contracts/social-agency, dual-layout routing, single-user session auth, Coldwell Banker rebrand, one clean initial migration.
- **Next**: Sprint 2 (marketing site content + SEO), Sprint 3 (realtor CRM: contact categories/tags, CSV/vCard import, realtor follow-up cadence, email + SMS drafts), Sprint 4 (Twilio SMS two-way, Google Contacts import).

## Working in this repo

- Ask before destructive moves (force pushes, schema drops).
- TypeScript strict; fix unused-var errors before pushing.
- Add migrations by incrementing from the highest number; keep them additive (the initial 0001 is the only pre-launch full-schema file).
