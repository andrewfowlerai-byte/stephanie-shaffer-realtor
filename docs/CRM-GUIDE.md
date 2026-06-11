# How Stephanie's CRM is set up

This is one app that serves both her public website and her private CRM, on one domain,
backed by one Supabase project. Stephanie is the only login.

## The shape of it

- **Frontend**: React + TypeScript + Vite + Tailwind, deployed on Vercel.
- **Routing** (`src/App.tsx`):
  - Public marketing pages render with no login: `/`, `/listings`, `/about`, `/process`, `/contact`.
  - `/login` is the agent sign-in.
  - Everything else (`/dashboard`, `/contacts`, `/follow-ups`, `/calendar`, `/settings`) is
    gated on a Supabase session and redirects to `/login` when signed out.
- **Backend**: Supabase (authentication + Postgres). Server functions live in `/api` on Vercel.
- **Single tenant**: there are no roles and no multi-tenant scoping. Any authenticated user
  (Stephanie) sees all the data. The only public write is the website contact form.

## Data model (Supabase)

Defined in `supabase/migrations/0001_initial_schema.sql` and `0002_realtor_contact_fields.sql`:

- **contacts**: the heart of the CRM. People, with realtor fields: `categories`
  (Buyer, Seller, Past Client, Sphere, Lead, Referral, Vendor), `birthday`,
  `closing_anniversary`, `last_contacted_at`, `address`, plus name, email, phone, notes,
  `next_followup`, and `source`. Any authenticated user has full access. The public website
  may INSERT a lead only (a Prospect with a `website-*` source).
- **calendar_events**: her calendar, owner-scoped.
- **reminders**: scheduled nudges fired by the `/api/check-reminders` cron, owner-scoped.
- **push_subscriptions**: Web Push device subscriptions, owner-scoped.
- **daily_tasks**: a daily checklist, owner-scoped.
- **listings**: homes managed by hand in the CRM Listings section. The public website reads
  published listings (anon select); the signed-in user manages all of them. Photos live in the
  public `listing-photos` storage bucket.
- **campaigns**, **campaign_steps**, **campaign_enrollments**: marketing and follow-up campaigns
  (drip sequences and one-time broadcasts), their steps, and which contacts are enrolled. Due
  touches surface on the Follow-ups page with an AI-drafted message to send.

Owner-scoped means the row's `user_id` must match the signed-in user. For a single-user CRM
that is just Stephanie.

## One-time setup

1. Create a Supabase project (hers only).
2. In the SQL editor, run `0001_initial_schema.sql`, then `0002_realtor_contact_fields.sql`.
3. Under Authentication, add Stephanie's single user (email + password, Auto Confirm). That
   is the only account.
4. Set the env vars in Vercel (see `SETUP.md`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`.
5. Deploy. (`SETUP.md` has the full provisioning runbook.)

## How data flows

- **Website contact form** (`/contact`) inserts a new `contacts` row as a Prospect, tagged
  `Lead`, via `src/lib/leads.ts`. It shows up in the CRM immediately.
- **Import** (CSV or vCard) bulk-inserts contacts and lets her tag the whole batch
  (`src/lib/importContacts.ts`).
- **The follow-up engine** (`src/lib/followups.ts`) reads each contact's categories, birthday,
  closing anniversary, last-contacted date, and any manual follow-up date, and decides who is
  worth a touch today. Nothing is stored; it is computed live from the contact data.
- **AI drafts** call `/api/draft-email` (OpenAI), which writes an email or a text in her warm,
  personal voice, tuned to the occasion (birthday, anniversary, check-in, follow-up).

## How she uses it day to day

1. **Sign in** at `/login`.
2. **Dashboard**: a quick snapshot, the daily checklist, and the suggested follow-ups.
3. **Contacts**:
   - Add a contact, or **Import** a phone export (vCard or CSV from iPhone or Google Contacts).
   - **Categorize**: tag people Buyer, Seller, Past Client, Sphere, Lead, Referral, or Vendor.
     Select several rows to bulk-tag.
   - **Log a touch** (the clock icon) records that she reached out today, which feeds the cadence.
   - **Draft** an email or text for anyone with one tap.
   - Edit or delete.
4. **Follow-ups** (`/follow-ups`): the daily "who to reach out to today" list. Birthdays and
   home anniversaries come first, then leads going quiet, active buyers and sellers, referrals,
   and quarterly sphere check-ins. For each person she can draft an email or text, open Mail,
   Messages, or the phone dialer, and mark the touch done.
5. **Listings**: add, edit, or hide her listings, with photo uploads. Changes appear on the
   public website immediately (no redeploy).
6. **Calendar**: appointments and events.
7. **Settings**: turn on push notifications (works as a phone home-screen app), and sign out.

## What is live vs pending

- **Live**: contacts, categories, import (CSV / vCard), the follow-up engine, the daily
  reach-out list, AI email and text drafting, calendar, daily tasks, push notifications.
- **Pending (need external setup)**:
  - **Sending from the CRM**: today she copies a draft or opens it in Mail / Messages.
    One-tap send needs Twilio (texts; requires a number + A2P 10DLC registration) and a
    verified sending domain in Resend (email).
  - **Google Contacts one-click sync**: needs a Google Cloud OAuth app. CSV / vCard import
    covers contacts in the meantime.
  - **MLS Now listings (optional)**: listings are managed manually in the CRM today.
    Connecting MLS Now (`docs/MLS-INTEGRATION.md`) is an optional upgrade if she ever wants the
    full area-wide search feed.

## Maintenance notes

- **Deploys**: `vercel --prod` from the repo, or connect the GitHub repo in the Vercel
  project for push-to-deploy.
- **Schema changes**: add a new numbered migration in `supabase/migrations/` (keep them
  additive) and run it in the Supabase SQL editor.
- **Secrets** live in `.env` (gitignored) locally and in Vercel project settings. Never in
  the repo or in chat.
