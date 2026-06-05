# ANF CRM

A password-protected CRM for ANF Consulting — track leads, manage clients, and monitor capacity across social media management, website design, and AI business integration services.

## Setup

### 1. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2. Create the Supabase table

In your Supabase project, run the following SQL in the SQL Editor:

```sql
create table contacts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  business_name text not null,
  contact_name text not null,
  email text,
  phone text,
  industry text,
  stage text not null default 'Prospect',
  tier integer,
  platforms text[],
  services text[],
  monthly_value numeric,
  blog_addons integer default 0,
  notes text,
  next_followup date,
  source text,
  onboarded boolean default false,
  pages_converted boolean default false
);

-- Enable Row Level Security
alter table contacts enable row level security;

-- Allow authenticated users full access
create policy "Authenticated users can do everything"
  on contacts
  for all
  to authenticated
  using (true)
  with check (true);
```

### 3. Create a Supabase user

In your Supabase project go to **Authentication > Users** and create a user with your email and password. This is the login used to access the CRM.

### 4. Install dependencies

```bash
npm install
```

### 5. Run the dev server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

## Features

- **Dashboard** — stats overview, capacity tracking, pipeline funnel, follow-ups due
- **Pipeline** — drag-and-drop Kanban board across 5 stages (Prospect → Client)
- **Contacts** — searchable, filterable, sortable table with edit/delete actions
- **Contact Modal** — full add/edit form with tier auto-pricing, blog add-ons, platform/service tracking

## Service Tiers

| Tier | Price | Included |
|------|-------|----------|
| Tier 1 — Starter | $350/mo | 3 platforms/1 post per day (or 1/3). Daily engagement. Blog add-ons +$50/mo each. |
| Tier 2 — Growth | $750/mo | 3 platforms, 3 posts/day, daily engagement, daily blog included. |
| Tier 3 — Full Service | $1,000/mo | 5 platforms, 3 posts/day, daily engagement, daily blog included. |
