-- Two CRM additions:
--   1. A "Phone Call" calendar event type.
--   2. Recurring daily tasks: a template that auto-creates a fresh daily_tasks
--      row on each selected weekday, so a task can repeat on chosen days of the
--      week and reset (uncompleted) each day it is scheduled.

-- ── 1. Phone Call event type ────────────────────────────────────────────────
alter table public.calendar_events drop constraint if exists calendar_events_type_check;
alter table public.calendar_events add constraint calendar_events_type_check
  check (type in ('lunch','meeting','phone_call','marketing_update','other'));

-- ── 2. Recurring tasks ──────────────────────────────────────────────────────
-- weekdays uses Postgres/JS convention: 0 = Sunday ... 6 = Saturday.
create table public.recurring_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  detail text,
  priority text not null default 'medium' check (priority in ('high','medium','low')),
  weekdays smallint[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index recurring_tasks_user_idx on public.recurring_tasks (user_id);

alter table public.recurring_tasks enable row level security;
create policy "recurring_tasks: owner all" on public.recurring_tasks
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Link a materialized daily task back to its template so we only create one
-- instance per (template, day). A null recurring_task_id is a normal one-off task.
alter table public.daily_tasks add column if not exists recurring_task_id uuid
  references public.recurring_tasks(id) on delete cascade;
create unique index if not exists daily_tasks_recurring_day_uniq
  on public.daily_tasks (recurring_task_id, task_date);

-- Allow 'recurring' as a task source.
alter table public.daily_tasks drop constraint if exists daily_tasks_source_check;
alter table public.daily_tasks add constraint daily_tasks_source_check
  check (source in ('debrief','manual','recurring'));
