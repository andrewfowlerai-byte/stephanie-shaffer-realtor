---
paths:
  - "src/**"
  - "api/**"
  - "supabase/**"
---

# Where things live

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

CRM core pieces: realtor follow-up cadence in `lib/followups.ts`, the daily list in `FollowUps`, AI drafts via `api/draft-email` + `lib/draft.ts` + `DraftModal`, birthdays and home anniversaries from migration 0002.
