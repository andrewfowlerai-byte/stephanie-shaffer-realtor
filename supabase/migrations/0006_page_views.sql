-- First-party website analytics: count page views + unique visitors so the
-- dashboard can show "how many people are seeing the site" without a third
-- party. The public site (anon) inserts a row per page view; the signed-in
-- user reads aggregate counts via the site_view_stats() function below.

create table public.page_views (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  path text,
  visitor_id text,   -- random id kept in the visitor's localStorage (no PII)
  referrer text
);
create index page_views_created_idx on public.page_views (created_at desc);
create index page_views_visitor_idx on public.page_views (visitor_id);

alter table public.page_views enable row level security;

-- The public website (anon) may insert view rows only.
create policy "page_views: anon insert" on public.page_views
  for insert to anon with check (true);
create policy "page_views: authed insert" on public.page_views
  for insert to authenticated with check (true);
-- The signed-in user (Stephanie) can read them.
create policy "page_views: authed read" on public.page_views
  for select to authenticated using (true);

-- Aggregate stats for the dashboard. SECURITY DEFINER so the counts run
-- regardless of row visibility; only authenticated users may call it.
create or replace function public.site_view_stats()
returns json
language sql
security definer
set search_path = public
as $$
  select json_build_object(
    'views_today', (
      select count(*) from page_views
      where (created_at at time zone 'America/New_York') >= date_trunc('day', now() at time zone 'America/New_York')
    ),
    'views_7d',     (select count(*) from page_views where created_at >= now() - interval '7 days'),
    'views_30d',    (select count(*) from page_views where created_at >= now() - interval '30 days'),
    'visitors_7d',  (select count(distinct visitor_id) from page_views where created_at >= now() - interval '7 days'),
    'visitors_30d', (select count(distinct visitor_id) from page_views where created_at >= now() - interval '30 days')
  );
$$;

revoke all on function public.site_view_stats() from public, anon;
grant execute on function public.site_view_stats() to authenticated;
