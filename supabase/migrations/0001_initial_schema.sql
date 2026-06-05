-- Stephanie Shaffer Realtor CRM. Initial schema.
--
-- Single-tenant: Stephanie is the only authenticated user, so authed rows are
-- visible to "any authenticated user". The only public access is the website
-- contact form, which may INSERT leads into contacts as the anon role.
--
-- Apply in the Supabase project SQL Editor (Dashboard, SQL Editor, New query).
-- After applying, create Stephanie's single auth user in Dashboard, Authentication.

create extension if not exists "pgcrypto";  -- gen_random_uuid()

-- ============================================================
-- contacts: leads, sphere, clients. The website inserts leads here.
-- ============================================================
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  business_name text,
  contact_name text not null,
  email text,
  phone text,
  industry text,
  stage text not null check (stage in (
    'Prospect','Contacted','In Conversation','Proposal Out','Client'
  )),
  tier smallint check (tier in (1,2,3)),
  platforms text[],
  services text[],
  monthly_value numeric,
  one_time_value numeric,
  blog_addons integer default 0,
  notes text,
  next_followup date,
  source text,
  onboarded boolean default false,
  pages_converted boolean default false,
  location text,
  local_spots text[]
);
create index contacts_stage_idx on public.contacts (stage);
create index contacts_next_followup_idx on public.contacts (next_followup);

-- ============================================================
-- calendar_events: owner-scoped to the single user.
-- ============================================================
create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  type text not null check (type in ('lunch','meeting','marketing_update','other')),
  recurrence text not null default 'none'
    check (recurrence in ('none','weekly','biweekly','monthly')),
  client_id uuid references public.contacts(id) on delete set null,
  client_name text,
  event_date date not null,
  event_time time,
  notes text,
  reminder_minutes integer,
  created_at timestamptz not null default now()
);
create index calendar_events_user_id_idx on public.calendar_events (user_id);
create index calendar_events_date_time_idx on public.calendar_events (event_date, event_time);

-- ============================================================
-- reminders: scheduled nudges fired by /api/check-reminders (cron, every minute).
-- ============================================================
create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  remind_at timestamptz not null,
  message text not null,
  related_contact_id uuid references public.contacts(id) on delete set null,
  channel text not null default 'email' check (channel in ('email','sms','push','all')),
  sent_at timestamptz,
  send_error text,
  created_at timestamptz not null default now()
);
create index reminders_due_idx on public.reminders (remind_at) where sent_at is null;
create index reminders_user_idx on public.reminders (user_id, remind_at desc);

-- ============================================================
-- push_subscriptions: one Web Push subscription per device.
-- ============================================================
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
create unique index push_subscriptions_user_endpoint_uniq on public.push_subscriptions (user_id, endpoint);
create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

-- ============================================================
-- daily_tasks: a daily checklist (manual for now).
-- ============================================================
create table public.daily_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_date date not null,
  title text not null,
  detail text,
  priority text not null default 'medium' check (priority in ('high','medium','low')),
  source text not null default 'manual' check (source in ('debrief','manual')),
  position integer not null default 0,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
create index daily_tasks_user_date_idx on public.daily_tasks (user_id, task_date desc, position);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.contacts          enable row level security;
alter table public.calendar_events   enable row level security;
alter table public.reminders         enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.daily_tasks       enable row level security;

-- contacts: any authenticated user (single tenant) gets full access.
create policy "contacts: authed all" on public.contacts
  for all to authenticated using (true) with check (true);

-- contacts: the public website (anon) may INSERT leads only. Reads/updates/deletes
-- stay authenticated-only. The row must be a Prospect with a website-* source.
create policy "contacts: anon website insert" on public.contacts
  for insert to anon
  with check (stage = 'Prospect' and source is not null and source like 'website-%');

-- Owner-scoped tables: only the row owner (the single user) may touch them.
create policy "calendar_events: owner all" on public.calendar_events
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "reminders: owner all" on public.reminders
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "push_subscriptions: owner all" on public.push_subscriptions
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "daily_tasks: owner all" on public.daily_tasks
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
