-- Realtor relationship fields for contacts. Additive and idempotent, so it is
-- safe to run after 0001 whether or not 0001 was applied first.
--
--  - categories: Buyer / Seller / Past Client / Sphere / Lead / Referral / Vendor
--    (a contact can hold several at once)
--  - birthday + closing_anniversary: recurring "stay in touch" touchpoints
--  - last_contacted_at: drives the follow-up cadence (days since last touch)
--  - address: mailing address for past-client touches and closing anniversaries

alter table public.contacts add column if not exists categories text[] not null default '{}';
alter table public.contacts add column if not exists birthday date;
alter table public.contacts add column if not exists closing_anniversary date;
alter table public.contacts add column if not exists last_contacted_at timestamptz;
alter table public.contacts add column if not exists address text;

create index if not exists contacts_categories_idx on public.contacts using gin (categories);
create index if not exists contacts_birthday_idx on public.contacts (birthday);
create index if not exists contacts_closing_anniversary_idx on public.contacts (closing_anniversary);
