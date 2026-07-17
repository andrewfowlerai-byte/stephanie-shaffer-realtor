-- Client testimonials (real, client-submitted reviews, e.g. exported from
-- TestimonialTree where the client marked them public). The public site reads
-- published rows; the signed-in user manages all of them.

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,          -- the client's name as they signed it
  quote text not null,         -- their words, verbatim
  rating smallint,             -- 1..5
  relationship text,           -- e.g. "Seller Client", "Buyer Client"
  date date,                   -- when the review was given
  published boolean not null default true,
  position integer not null default 0
);
create index testimonials_pub_idx on public.testimonials (published, position);

alter table public.testimonials enable row level security;

create policy "testimonials: public read published" on public.testimonials
  for select to anon using (published = true);
create policy "testimonials: authed all" on public.testimonials
  for all to authenticated using (true) with check (true);
