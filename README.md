# Stephanie Shaffer: Realtor Website + CRM

One React app that serves Stephanie Shaffer's public marketing website and her private, single-user CRM on a single domain, backed by one Supabase project. Built by ANF Consulting.

See `CLAUDE.md` for architecture and conventions, and `SETUP.md` for provisioning and deploy steps.

## Stack

React 19, TypeScript, Vite, Tailwind CSS v3, Supabase, Vercel.

## Develop

```bash
npm install
npm run dev      # Vite dev server
npm run build    # type-checks then builds; type errors block the build
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in a local `.env` (gitignored). Full setup is in `SETUP.md`.

## What it does

- **Public marketing site**: home, about, listings, areas served, and a contact form that drops new leads straight into the CRM (auto-tagged Lead).
- **Private CRM** (single login): contacts with realtor categories, CSV and vCard import, birthday and home-anniversary tracking, a daily "who to reach out to today" list, and AI-drafted email and text in a warm, personal voice.

## Conventions

No em-dashes anywhere in copy. Times are pinned to America/New_York. Mobile first. The build gates the deploy.
