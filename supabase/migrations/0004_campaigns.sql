-- Marketing + follow-up campaigns. Two kinds:
--   sequence  = a drip: ordered steps that fire on a schedule after enrollment.
--   broadcast = a one-time message to a segment (a single step due now).
-- Single-tenant: any authenticated user manages everything. No public access.

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  description text,
  type text not null default 'sequence' check (type in ('sequence', 'broadcast')),
  active boolean not null default true
);

create table public.campaign_steps (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  position integer not null default 0,
  day_offset integer not null default 0,
  channel text not null default 'email' check (channel in ('email', 'text', 'call', 'task')),
  draft_type text not null default 'check_in' check (draft_type in ('birthday', 'anniversary', 'check_in', 'follow_up', 'intro')),
  subject text,
  body text,    -- optional fixed template (supports {{first_name}}); if null, the message is AI-drafted
  prompt text   -- optional context handed to the AI draft
);
create index campaign_steps_campaign_idx on public.campaign_steps (campaign_id, position);

create table public.campaign_enrollments (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  current_step integer not null default 0,
  next_due date,
  status text not null default 'active' check (status in ('active', 'completed', 'paused', 'stopped')),
  unique (campaign_id, contact_id)
);
create index campaign_enrollments_due_idx on public.campaign_enrollments (status, next_due);
create index campaign_enrollments_contact_idx on public.campaign_enrollments (contact_id);

alter table public.campaigns            enable row level security;
alter table public.campaign_steps       enable row level security;
alter table public.campaign_enrollments enable row level security;

create policy "campaigns: authed all" on public.campaigns
  for all to authenticated using (true) with check (true);
create policy "campaign_steps: authed all" on public.campaign_steps
  for all to authenticated using (true) with check (true);
create policy "campaign_enrollments: authed all" on public.campaign_enrollments
  for all to authenticated using (true) with check (true);
