import { supabase } from './supabase';

/**
 * Web Push subscription helpers. Registers the service worker, asks for
 * notification permission, subscribes via PushManager, and persists the
 * subscription to Supabase so the reminders cron can fire pushes to it.
 *
 * iOS Safari only honors web push when the app is installed to the home
 * screen as a PWA (iOS 16.4+). On other devices the standard web push
 * mechanism works inside any modern browser.
 */

const VAPID_PUBLIC_KEY = (import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined) ?? '';

export type PushStatus =
  | 'unsupported'
  | 'denied'
  | 'unsubscribed'
  | 'subscribed';

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  } catch (err) {
    console.error('[push] SW register failed', err);
    return null;
  }
}

export function pushSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export async function currentPushStatus(): Promise<PushStatus> {
  if (!pushSupported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return 'unsubscribed';
  return 'subscribed';
}

/**
 * Request permission + subscribe + persist. Returns 'subscribed' on success
 * or one of the error states. Safe to call repeatedly — re-subscribing from
 * the same browser is idempotent (the upsert by (user, endpoint) just bumps
 * last_seen_at).
 */
export async function enablePush(): Promise<PushStatus> {
  if (!pushSupported()) return 'unsupported';
  if (!VAPID_PUBLIC_KEY) {
    console.error('[push] VITE_VAPID_PUBLIC_KEY env var is missing');
    return 'unsupported';
  }

  // Ensure SW is installed
  await registerServiceWorker();
  const reg = await navigator.serviceWorker.ready;

  // Permission prompt
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return perm === 'denied' ? 'denied' : 'unsubscribed';

  // Subscribe (or reuse existing subscription on this device)
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as BufferSource,
    });
  }

  // Persist to server. We send the whole subscription JSON; the API
  // extracts endpoint + p256dh + auth and upserts.
  const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      console.warn('[push] no auth session, cannot persist subscription');
      return 'unsubscribed';
    }
    const res = await fetch('/api/save-push-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        endpoint: json.endpoint,
        p256dh: json.keys?.p256dh,
        auth: json.keys?.auth,
        userAgent: navigator.userAgent,
      }),
    });
    if (!res.ok) {
      console.error('[push] save subscription failed', await res.text());
      return 'unsubscribed';
    }
  } catch (err) {
    console.error('[push] save subscription threw', err);
    return 'unsubscribed';
  }

  return 'subscribed';
}

/**
 * Unsubscribe locally and let the cron's send-failure cleanup drop the row
 * server-side next time it tries to deliver.
 */
export async function disablePush(): Promise<void> {
  if (!pushSupported()) return;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (sub) {
    try { await sub.unsubscribe(); } catch { /* ignore */ }
  }
}

// ---------- helpers ----------

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}
