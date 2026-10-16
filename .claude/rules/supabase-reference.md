---
paths:
  - "supabase/**"
  - "api/**"
  - "src/lib/supabase.ts"
  - "src/lib/leads.ts"
  - "src/lib/importContacts.ts"
  - "src/lib/calendarEvents.ts"
  - "src/lib/dailyTasks.ts"
  - "src/lib/push.ts"
  - "src/hooks/useContacts.ts"
---

# Supabase

Single-tenant project. Tables (see `supabase/migrations/`):

- `contacts`: leads, sphere, clients. Realtor fields: `categories` (Buyer/Seller/Past Client/Sphere/Lead/Referral/Vendor), `birthday`, `closing_anniversary`, `last_contacted_at`, `address`. Authenticated users have full access; the public website (anon) may INSERT leads only (Prospect + `website-*` source).
- `calendar_events`, `reminders`, `push_subscriptions`, `daily_tasks`: owner-scoped to the single user (`user_id = auth.uid()`).

After applying the migrations, add Stephanie's single auth user in the Supabase dashboard. See `SETUP.md`.
