/// <reference types="node" />

/**
 * POST /api/notify-lead
 * Body: { contact_name, email?, phone?, notes? }
 *
 * Sends up to two emails via Resend (best-effort: the lead is already saved by
 * the client in lib/leads.ts, so nothing here ever blocks the visitor):
 *   1. A notification to Stephanie (LEAD_NOTIFY_EMAIL), reply-to set to the lead.
 *   2. A warm auto-reply to the visitor, when they left an email, reply-to her.
 *
 * Recipient for (1) comes from LEAD_NOTIFY_EMAIL (falls back to her brokerage
 * email). Requires RESEND_API_KEY + RESEND_FROM_EMAIL (a verified Resend sender).
 */
import { brandedEmail } from './_email';

export const config = { runtime: 'edge' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const resendKey = process.env.RESEND_API_KEY ?? '';
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Stephanie Shaffer <noreply@buysellhomesohio.com>';
  const notifyTo = process.env.LEAD_NOTIFY_EMAIL || 'stephanie.shaffer@cbschmidtohio.com';

  // No email service configured: not an error. The lead is already saved.
  if (!resendKey) return json({ ok: false, skipped: 'email not configured' });

  let body: { contact_name?: string; email?: string; phone?: string; notes?: string };
  try { body = await req.json(); } catch { return json({ error: 'Invalid body' }, 400); }

  const name = (body.contact_name || 'Someone').toString().trim().slice(0, 200);
  const firstName = name.split(/\s+/)[0] || name;
  const email = (body.email || '').toString().trim().slice(0, 200);
  const phone = (body.phone || '').toString().trim().slice(0, 50);
  const notes = (body.notes || '').toString().trim().slice(0, 2000);

  // 1. Notify Stephanie.
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
  ].filter((l) => l !== '').join('\n');

  const agentEmailed = await sendViaResend(resendKey, {
    from: fromEmail,
    to: notifyTo,
    subject: `New website lead: ${name}`,
    text: agentText,
    html: brandedEmail({ title: `New website lead: ${name}`, preheader: `${name} reached out through your website.`, bodyHtml: agentBody }),
    reply_to: email || undefined,
  });

  // 2. Auto-reply to the visitor (only if they left an email).
  let autoReplied: boolean | null = null;
  if (email) {
    const replyBody = [
      `<p style="margin:0 0 14px;">Hi ${esc(firstName)},</p>`,
      `<p style="margin:0 0 14px;">Thank you for reaching out. I just received your note, and I will get back to you personally as soon as I can, usually within a day.</p>`,
      `<p style="margin:0 0 14px;">Whether you are buying, selling, or simply thinking things through, there is no pressure here. We will move at the pace that feels right for you.</p>`,
      `<p style="margin:0;">Talk soon,<br>Stephanie</p>`,
    ].join('\n');
    const replyText = `Hi ${firstName},\n\nThank you for reaching out. I just received your note, and I will get back to you personally as soon as I can, usually within a day.\n\nWhether you are buying, selling, or simply thinking things through, there is no pressure here. We will move at the pace that feels right for you.\n\nTalk soon,\nStephanie`;
    autoReplied = await sendViaResend(resendKey, {
      from: fromEmail,
      to: email,
      subject: 'Thank you for reaching out',
      text: replyText,
      html: brandedEmail({ title: 'Thank you for reaching out', preheader: 'I got your note and will be in touch soon.', bodyHtml: replyBody }),
      reply_to: notifyTo,
    });
  }

  return json({ ok: agentEmailed || autoReplied === true, agentEmailed, autoReplied });
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
    if (!r.ok) {
      console.error('[notify-lead] resend error', r.status, (await r.text()).slice(0, 300));
      return false;
    }
    return true;
  } catch (err) {
    console.error('[notify-lead] send threw', err);
    return false;
  }
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function json(b: unknown, status = 200): Response {
  return new Response(JSON.stringify(b), { status, headers: { 'Content-Type': 'application/json' } });
}
