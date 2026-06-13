/// <reference types="node" />
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import { brandedEmail } from './_email';

/**
 * GET / POST /api/check-reminders
 *
 * Cron-driven sender for the reminders table. Pulls every row where
 * remind_at <= now() AND sent_at IS NULL, fires each one through the
 * configured channels, then marks sent_at + send_error.
 *
 * Channels per reminder:
 * - 'push' (default when subscriptions exist): sends Web Push to every
 *   subscription on file for the staff user. iOS PWA shows it as a system
 *   notification.
 * - 'email': sends via Resend as a fallback or alongside push.
 *
 * Cron schedule: every minute (defined in vercel.json). On Vercel Hobby
 * tier you may need a 3rd-party pinger (cron-job.org, EasyCron) hitting
 * this URL on a free minutely schedule instead.
 *
 * VAPID setup: generate keys once with `npx web-push generate-vapid-keys`
 * and add to Vercel env:
 *   - VITE_VAPID_PUBLIC_KEY (browser-visible, for subscribe)
 *   - VAPID_PRIVATE_KEY      (server-only)
 *   - VAPID_SUBJECT          (mailto: address — required by spec)
 */

export const config = { runtime: 'nodejs' };

interface SubscriptionRow {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface ReminderRow {
  id: string;
  user_id: string;
  message: string;
  channel: string;
  remind_at: string;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: 'Server not configured.' }, 500);
  }

  const vapidPublic = process.env.VITE_VAPID_PUBLIC_KEY ?? '';
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY ?? '';
  const vapidSubject = process.env.VAPID_SUBJECT ?? 'mailto:hello@example.com';
  const hasWebPush = !!(vapidPublic && vapidPrivate);
  if (hasWebPush) {
    webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
  }

  const resendKey = process.env.RESEND_API_KEY ?? '';
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Stephanie Shaffer <noreply@buysellhomesohio.com>';

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Pull every reminder due in the past or right now
  const nowIso = new Date().toISOString();
  const { data: dueRaw, error: fetchError } = await admin
    .from('reminders')
    .select('id, user_id, message, channel, remind_at')
    .lte('remind_at', nowIso)
    .is('sent_at', null)
    .order('remind_at', { ascending: true })
    .limit(200);
  if (fetchError) return json({ error: fetchError.message }, 500);

  const due = (dueRaw ?? []) as ReminderRow[];
  if (due.length === 0) return json({ ok: true, sent: 0 });

  // Pre-fetch all subscriptions for the affected users (one round trip)
  const affectedUserIds = Array.from(new Set(due.map((d) => d.user_id)));
  const { data: subsRaw } = await admin
    .from('push_subscriptions')
    .select('id, user_id, endpoint, p256dh, auth')
    .in('user_id', affectedUserIds);
  const subsByUser = new Map<string, SubscriptionRow[]>();
  for (const s of (subsRaw ?? []) as Array<SubscriptionRow & { user_id: string }>) {
    if (!subsByUser.has(s.user_id)) subsByUser.set(s.user_id, []);
    subsByUser.get(s.user_id)!.push({
      id: s.id,
      endpoint: s.endpoint,
      p256dh: s.p256dh,
      auth: s.auth,
    });
  }

  // Pre-fetch user emails for the email channel
  let userEmails: Record<string, string> = {};
  if (resendKey) {
    const { data: users } = await admin.auth.admin.listUsers();
    for (const u of users?.users ?? []) {
      if (u.email) userEmails[u.id] = u.email;
    }
  }

  let sent = 0;
  let failed = 0;
  const expiredSubIds: string[] = [];

  for (const reminder of due) {
    const channel = reminder.channel || 'email';
    let success = false;
    const errors: string[] = [];

    // Channel: push (Web Push to every subscription for this user)
    if ((channel === 'push' || channel === 'all') && hasWebPush) {
      const subs = subsByUser.get(reminder.user_id) ?? [];
      for (const sub of subs) {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            JSON.stringify({
              title: 'Reminder',
              body: reminder.message,
              url: '/',
              tag: `reminder-${reminder.id}`,
              requireInteraction: false,
            }),
          );
          success = true;
        } catch (err: unknown) {
          const e = err as { statusCode?: number; body?: string; message?: string };
          // 404 / 410 mean the subscription is dead — clean it up
          if (e.statusCode === 404 || e.statusCode === 410) {
            expiredSubIds.push(sub.id);
          } else {
            errors.push(`push: ${e.statusCode ?? ''} ${e.message ?? ''}`.trim());
          }
        }
      }
    }

    // Channel: email
    if ((channel === 'email' || channel === 'all' || !success) && resendKey) {
      const recipient = userEmails[reminder.user_id];
      if (recipient) {
        try {
          const r = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${resendKey}`,
            },
            body: JSON.stringify({
              from: fromEmail,
              to: recipient,
              subject: 'Reminder',
              text: reminder.message,
              html: brandedEmail({ title: 'Reminder', preheader: reminder.message.slice(0, 140), bodyHtml: `<p style="margin:0;">${escapeHtml(reminder.message)}</p>` }),
              reply_to: 'stephanie.shaffer@cbschmidtohio.com',
            }),
          });
          if (r.ok) {
            success = true;
          } else {
            errors.push(`email: ${r.status} ${await r.text()}`);
          }
        } catch (err) {
          errors.push(`email: ${err instanceof Error ? err.message : 'unknown'}`);
        }
      }
    }

    // Mark the reminder as sent (or record the error)
    const { error: updateErr } = await admin
      .from('reminders')
      .update({
        sent_at: new Date().toISOString(),
        send_error: success ? null : errors.join(' / ').slice(0, 500) || 'No channel available',
      })
      .eq('id', reminder.id);
    if (updateErr) console.error('[check-reminders] mark sent failed', updateErr);

    if (success) sent++;
    else failed++;
  }

  // Clean up expired subscriptions (404/410)
  if (expiredSubIds.length > 0) {
    await admin.from('push_subscriptions').delete().in('id', expiredSubIds);
  }

  return json({ ok: true, sent, failed, expiredSubs: expiredSubIds.length });
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
