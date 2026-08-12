/// <reference types="node" />

/**
 * POST /api/submit-lead
 * Body: { contact_name, email?, phone?, notes?, hp?, elapsedMs? }
 *
 * The single, guarded entry point for public website leads. It:
 *   1. Silently drops bot submissions (honeypot, too-fast timer, foreign origin,
 *      spammy content) BEFORE anything is saved or emailed.
 *   2. Saves a real lead server-side with the Supabase service role, so the
 *      public anon insert on `contacts` can be revoked (closing the direct-to-
 *      database spam hole).
 *   3. Emails Stephanie + auto-replies to the visitor (Resend), best-effort.
 *
 * Anti-spam is enforced HERE (server-side) so a bot cannot bypass it by
 * scripting the form or calling the database directly.
 *
 * Response tells the client how storage was handled:
 *   { store: 'done' }   -> handled here (dropped as spam, or saved server-side)
 *   { store: 'client' } -> service role not configured yet; client should
 *                          fall back to the legacy anon insert so no lead is lost.
 */
import { brandedEmail } from './_email';

export const config = { runtime: 'edge' };

const ALLOWED_HOSTS = ['buysellhomesohio.com', 'localhost', '127.0.0.1'];
const MIN_FILL_MS = 2000; // nobody fills a multi-field contact form this fast

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body: {
    contact_name?: string; email?: string; phone?: string; notes?: string;
    hp?: string; elapsedMs?: number;
  };
  try { body = await req.json(); } catch { return json({ store: 'done' }); }

  const name = (body.contact_name || '').toString().trim().slice(0, 200);
  const email = (body.email || '').toString().trim().slice(0, 200);
  const phone = (body.phone || '').toString().trim().slice(0, 50);
  const notes = (body.notes || '').toString().trim().slice(0, 2000);

  // ── Bot filters. Any hit is silently accepted (so we never teach a bot what
  //    tripped it) but nothing is saved or emailed. Order cheapest first. ──

  // 1. Honeypot: a hidden field real users never fill.
  if ((body.hp || '').toString().trim() !== '') return dropped();

  // 2. Timing: our form always sends elapsedMs. Missing or too-fast = a script.
  if (typeof body.elapsedMs !== 'number' || !isFinite(body.elapsedMs) || body.elapsedMs < MIN_FILL_MS) {
    return dropped();
  }

  // 3. Origin: block cross-site posts. Absent origin is allowed (some privacy
  //    setups strip it); only a present, foreign origin is dropped.
  const origin = req.headers.get('origin') || '';
  if (origin) {
    try {
      const host = new URL(origin).hostname;
      const ok = host.endsWith('.vercel.app') ||
        ALLOWED_HOSTS.some((h) => host === h || host.endsWith('.' + h));
      if (!ok) return dropped();
    } catch { /* malformed origin, ignore */ }
  }

  // 4. Required name (the form enforces this; empty = a bot).
  if (!name) return dropped();

  // 5. Content heuristics (conservative: a real buyer may paste one listing link).
  if (looksSpammy(name, notes)) return dropped();

  // ── Real lead. Email first (independent of storage), then store. ──
  await notify({ name, email, phone, notes });

  const stored = await storeLead({ name, email, phone, notes });
  return json({ store: stored ? 'done' : 'client' });
}

function dropped(): Response { return json({ store: 'done', dropped: true }); }

/** Conservative spam signal. Favors keeping real leads; the honeypot, timer and
 *  origin checks carry the load. */
function looksSpammy(name: string, notes: string): boolean {
  const blob = `${name}\n${notes}`;
  // A name never contains a URL, a newline, or runs absurdly long.
  if (/(https?:\/\/|www\.)/i.test(name) || /[\r\n]/.test(name) || name.length > 120) return true;
  // Link/markup payloads used by comment-spam bots.
  if (/\[url|\[\/url\]|<a\s+href|href\s*=|\{\{|\}\}|\[link/i.test(blob)) return true;
  // Two or more links in the message (one plain listing link is fine).
  if ((notes.match(/https?:\/\/\S+/gi) || []).length >= 2) return true;
  // Tight, unambiguous spam vocabulary (kept clear of real-estate/mortgage words).
  if (/\b(seo services|back ?link|guest post|link building|casino|viagra|cialis|escort service|\bporn\b|\bxxx\b|buy followers|rank (your|higher) (on|in) google|increase (your )?(web )?traffic|digital marketing services)\b/i.test(blob)) return true;
  return false;
}

/** Insert with the service role (bypasses RLS). Returns false if not configured
 *  or the write fails, so the client can fall back to the legacy anon insert. */
async function storeLead(l: { name: string; email: string; phone: string; notes: string }): Promise<boolean> {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !key) return false;
  const row = {
    contact_name: l.name,
    email: l.email || null,
    phone: l.phone || null,
    notes: l.notes || null,
    stage: 'Prospect',
    source: 'website-contact-form',
    categories: ['Lead'],
  };
  try {
    const r = await fetch(`${url.replace(/\/$/, '')}/rest/v1/contacts`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(row),
    });
    if (r.ok) return true;
    console.error('[submit-lead] store failed', r.status, (await r.text()).slice(0, 300));
    return false;
  } catch (err) {
    console.error('[submit-lead] store threw', err);
    return false;
  }
}

/** The two lead emails (agent notification + visitor auto-reply). Best-effort. */
async function notify(l: { name: string; email: string; phone: string; notes: string }): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY ?? '';
  if (!resendKey) return;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Stephanie Shaffer <noreply@buysellhomesohio.com>';
  const notifyTo = process.env.LEAD_NOTIFY_EMAIL || 'stephanie.shaffer@buysellhomesohio.com';
  const { name, email, phone, notes } = l;
  const firstName = name.split(/\s+/)[0] || name;

  const agentBody = [
    `<p style="margin:0 0 14px;"><strong style="color:#0e1e3a;">${esc(name)}</strong> reached out through your website.</p>`,
    email ? `<p style="margin:0 0 6px;">Email: <a href="mailto:${esc(email)}" style="color:#9a6a10;">${esc(email)}</a></p>` : '',
    phone ? `<p style="margin:0 0 6px;">Phone: <a href="tel:${esc(phone)}" style="color:#9a6a10;">${esc(phone)}</a></p>` : '',
    notes ? `<p style="margin:16px 0 0;padding:12px 14px;background:#faf8f5;border:1px solid #e7e0d6;border-radius:8px;color:#463f35;white-space:pre-wrap;">${esc(notes)}</p>` : '',
    `<p style="margin:18px 0 0;color:#7e7363;font-size:13px;">It is already saved in your CRM under Contacts.${email ? ` A confirmation reply was sent to ${esc(name)}.` : ''}</p>`,
  ].filter(Boolean).join('\n');
  const agentText = [
    `New contact request from your website.`, ``,
    `Name: ${name}`,
    email ? `Email: ${email}` : '',
    phone ? `Phone: ${phone}` : '',
    notes ? `\nMessage:\n${notes}` : '',
    ``, `Saved in your CRM under Contacts.`,
  ].filter((line) => line !== '').join('\n');

  await sendViaResend(resendKey, {
    from: fromEmail,
    to: notifyTo,
    subject: `New website lead: ${name}`,
    text: agentText,
    html: brandedEmail({ title: `New website lead: ${name}`, preheader: `${name} reached out through your website.`, bodyHtml: agentBody }),
    reply_to: email || undefined,
  });

  if (email) {
    const replyBody = [
      `<p style="margin:0 0 14px;">Hi ${esc(firstName)},</p>`,
      `<p style="margin:0 0 14px;">Thank you for reaching out. I just received your note, and I will get back to you personally as soon as I can, usually within a day.</p>`,
      `<p style="margin:0 0 14px;">Whether you are buying, selling, or simply thinking things through, there is no pressure here. We will move at the pace that feels right for you.</p>`,
      `<p style="margin:0;">Talk soon,<br>Stephanie</p>`,
    ].join('\n');
    const replyText = `Hi ${firstName},\n\nThank you for reaching out. I just received your note, and I will get back to you personally as soon as I can, usually within a day.\n\nWhether you are buying, selling, or simply thinking things through, there is no pressure here. We will move at the pace that feels right for you.\n\nTalk soon,\nStephanie`;
    await sendViaResend(resendKey, {
      from: fromEmail,
      to: email,
      subject: 'Thank you for reaching out',
      text: replyText,
      html: brandedEmail({ title: 'Thank you for reaching out', preheader: 'I got your note and will be in touch soon.', bodyHtml: replyBody }),
      reply_to: notifyTo,
    });
  }
}

async function sendViaResend(key: string, payload: Record<string, unknown>): Promise<boolean> {
  try {
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(payload)) if (v !== undefined) clean[k] = v;
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify(clean),
    });
    if (!r.ok) { console.error('[submit-lead] resend error', r.status, (await r.text()).slice(0, 300)); return false; }
    return true;
  } catch (err) {
    console.error('[submit-lead] send threw', err);
    return false;
  }
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function json(b: unknown, status = 200): Response {
  return new Response(JSON.stringify(b), { status, headers: { 'Content-Type': 'application/json' } });
}
