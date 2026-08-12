-- Close the direct-to-database spam hole.
--
-- Until now the public website inserted leads straight into `contacts` with the
-- anon key, so a bot could skip the form entirely and POST to the REST API using
-- the public key baked into the site bundle. All lead capture now goes through
-- the guarded /api/submit-lead endpoint, which runs anti-spam server-side
-- (honeypot, submit timer, origin, content) and writes with the service role
-- (which bypasses RLS). Revoking the anon insert policy means the public role can
-- no longer write to `contacts` at all.
--
-- Run this AFTER SUPABASE_SERVICE_ROLE_KEY is set in Vercel and a live test lead
-- has saved through the endpoint. Reversible: re-create the policy from
-- migration 0001 if you ever need to roll back.

drop policy if exists "contacts: anon website insert" on public.contacts;
