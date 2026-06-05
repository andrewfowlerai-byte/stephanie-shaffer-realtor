/// <reference types="node" />
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/save-push-subscription
 * Body: { endpoint, p256dh, auth, userAgent? }
 * Auth: Bearer <staff JWT>
 *
 * Upserts a row in push_subscriptions for this user + endpoint combo. Called
 * by lib/push.ts after the browser hands us a PushSubscription. Re-sending
 * the same endpoint just bumps last_seen_at, so the registration flow stays
 * idempotent.
 */

export const config = { runtime: 'edge' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  if (!supabaseUrl || !serviceRoleKey) return json({ error: 'Server not configured.' }, 500);

  const authHeader = req.headers.get('authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) return json({ error: 'Missing authorization.' }, 401);
  const jwt = authHeader.slice(7);

  let body: { endpoint?: string; p256dh?: string; auth?: string; userAgent?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid body.' }, 400);
  }
  if (!body.endpoint || !body.p256dh || !body.auth) {
    return json({ error: 'Missing endpoint / p256dh / auth.' }, 400);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: userInfo, error: userErr } = await admin.auth.getUser(jwt);
  if (userErr || !userInfo?.user) return json({ error: 'Invalid auth.' }, 401);
  const userId = userInfo.user.id;

  // Single-tenant: any authenticated user is the owner. A valid JWT is enough.

  // Upsert by (staff_user_id, endpoint). Refresh last_seen_at on re-subscribe.
  const now = new Date().toISOString();
  const { error } = await admin
    .from('push_subscriptions')
    .upsert(
      {
        user_id: userId,
        endpoint: body.endpoint,
        p256dh: body.p256dh,
        auth: body.auth,
        user_agent: body.userAgent ?? null,
        last_seen_at: now,
      },
      { onConflict: 'user_id,endpoint' },
    );
  if (error) return json({ error: error.message }, 500);

  return json({ ok: true });
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}
