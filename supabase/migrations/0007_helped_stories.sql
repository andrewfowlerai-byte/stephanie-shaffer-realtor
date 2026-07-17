-- "Recently helped": anonymized short stories of buyers/sellers Stephanie has
-- helped. Deliberately no client names, addresses, or photos, just a situation
-- and an area (e.g., "Helped a first-time buyer find a home in Mentor"). This
-- keeps it clear of client-privacy, Fair Housing, and listing-broker rules.
-- The public site reads published rows; the signed-in user manages all of them.

create table public.helped_stories (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  summary text not null,   -- the anonymized story
  area text,               -- city / area only, e.g. "Mentor"
  year smallint,           -- e.g. 2025
  published boolean not null default true,
  position integer not null default 0
);
create index helped_stories_pub_idx on public.helped_stories (published, position);

alter table public.helped_stories enable row level security;

create policy "helped_stories: public read published" on public.helped_stories
  for select to anon using (published = true);
create policy "helped_stories: authed all" on public.helped_stories
  for all to authenticated using (true) with check (true);
