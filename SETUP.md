# Stephanie Shaffer Realtor: Setup and Provisioning Runbook

One app, one domain: a public marketing site plus a private single-user CRM, backed by one Supabase project. Stephanie is the only login. No secret values appear in this file, only env var names.

## 1. Local development

```
npm install
npm run dev      # Vite dev server
npm run build    # tsc -b && vite build (type errors block the build)
```

Create a local `.env` (gitignored) once Supabase exists:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

A placeholder `.env` is committed-ignored and only lets the UI boot offline. Replace with real values.

## 2. Supabase project (single tenant, Stephanie only)

1. Create a new Supabase project, used only for Stephanie.
2. SQL Editor: run `supabase/migrations/0001_initial_schema.sql`.
3. Authentication, Users: add Stephanie's single user (email + password). That is the only account. There is no invite flow.
4. Copy the Project URL and anon public key into `.env` and into Vercel.

## 3. Vercel project

1. New Vercel project from the GitHub repo. Framework preset: Vite. Build: `npm run build`. Output dir: `dist`.
2. Environment variables (Project Settings, Environment Variables):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server only, used by `/api` functions)
   - `OPENAI_API_KEY` (AI email drafts in the CRM)
   - `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (outbound email and reminder emails)
   - `VITE_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (web push; generate with `npx web-push generate-vapid-keys`)
   - `VITE_GOOGLE_PLACES_API_KEY` (optional, city autocomplete in the contact form; plain text still works without it)
3. The `/api/check-reminders` cron is in `vercel.json` (every minute). On the Hobby tier you may need an external pinger.
4. Deploy. Use the temporary Vercel domain for now; Stephanie attaches her real domain later.

## 4. Later sprints (add these env vars when those features land)

- Twilio SMS (Phase 2): `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_MESSAGING_SERVICE_SID`.
  Start the A2P 10DLC brand and campaign registration as early as possible. Carrier approval is the long pole.
- Google Contacts import (Phase 2): `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URI`, `TOKEN_ENCRYPTION_KEY`.

## 5. Brand placeholders to replace with Stephanie's brand kit

- `public/icon.svg` (placeholder house monogram on Coldwell Banker navy)
- Contact email and phone placeholders (`hello@example.com`, `(000) 000-0000`) in `Header`, `Footer`, and the `Contact` page
- Marketing copy and photography in `src/pages/marketing/*` (built out in Sprint 2)
- Palette is Coldwell Banker navy with a warm gold accent; tune hex values in `tailwind.config.js` (keep the token names)

## Never commit secrets

All keys live in `.env` (gitignored) and Vercel settings. This repo references env var names only.
