-- Listings managed by hand in the CRM (no MLS / IDX feed). The public website
-- reads PUBLISHED listings; the signed-in user (Stephanie) manages all of them.
-- Photos live in a public 'listing-photos' storage bucket.

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status text not null default 'Active' check (status in ('Active', 'Pending', 'Sold')),
  address text not null,
  city text,
  price numeric,
  beds integer,
  baths numeric,
  sqft integer,
  mls text,
  description text,
  photos text[] not null default '{}',
  published boolean not null default true,
  position integer not null default 0
);
create index listings_published_idx on public.listings (published, position);

alter table public.listings enable row level security;

-- Public website (anon) sees published listings only.
create policy "listings: public read published" on public.listings
  for select to anon using (published = true);
-- Signed-in user manages everything.
create policy "listings: authed all" on public.listings
  for all to authenticated using (true) with check (true);

-- ============================================================
-- Photo storage bucket (public read). If creating storage policies here errors
-- on permissions, create the bucket named 'listing-photos' (public) in the
-- Supabase dashboard under Storage instead.
-- ============================================================
insert into storage.buckets (id, name, public)
  values ('listing-photos', 'listing-photos', true)
  on conflict (id) do nothing;

create policy "listing photos public read" on storage.objects
  for select to public using (bucket_id = 'listing-photos');
create policy "listing photos authed insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'listing-photos');
create policy "listing photos authed update" on storage.objects
  for update to authenticated using (bucket_id = 'listing-photos');
create policy "listing photos authed delete" on storage.objects
  for delete to authenticated using (bucket_id = 'listing-photos');
