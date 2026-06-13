/// <reference types="node" />

/**
 * POST /api/notify-lead
 * Body: { contact_name, email?, phone?, notes? }
 *
 * Emails Stephanie when the public website contact form is submitted. The lead
 * itself is already saved to the CRM by the client (lib/leads.ts); this is a
 * best-effort notification, so a missing/failed email never blocks the visitor.
 *
 * Recipient comes from LEAD_NOTIFY_EMAIL (falls back to her brokerage email).
 * Requires RESEND_API_KEY + RESEND_FROM_EMAIL (a verified Resend sender).
 * Replies go to the lead's own email so she can answer directly.
 */
export const config = { runtime: 'edge' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const resendKey = process.env.RESEND_API_KEY ?? '';
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Stephanie Shaffer <noreply@buysellhomesohio.com>';
  const to = process.env.LEAD_NOTIFY_EMAIL || 'stephanie.shaffer@cbschmidtohio.com';

  // No email service configured: not an error. The lead is already saved.
  if (!resendKey) return json({ ok: false, skipped: 'email not configured' });

  let body: { contact_name?: string; email?: string; phone?: string; notes?: string };
  try { body = await req.json(); } catch { return json({ error: 'Invalid body' }, 400); }

  const name = (body.contact_name || 'Someone').toString().trim().slice(0, 200);
  const email = (body.email || '').toString().trim().slice(0, 200);
  const phone = (body.phone || '').toString().trim().slice(0, 50);
  const notes = (body.notes || '').toString().trim().slice(0, 2000);

  const lines = [
    `New contact request from your website.`,
    ``,
    `Name: ${name}`,
    email ? `Email: ${email}` : '',
    phone ? `Phone: ${phone}` : '',
    notes ? `\nMessage:\n${notes}` : '',
    ``,
    `It is already saved in your CRM under Contacts.`,
  ].filter((l) => l !== '');

  const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f1ea;font-family:'Inter',Helvetica,Arial,sans-serif;">
    <div style="max-width:560px;margin:32px auto;background:#ffffff;border:1px solid #e7e2d6;border-radius:14px;overflow:hidden;">
      <div style="background:#0e1e3a;padding:18px 26px;">
        <div style="font-size:16px;font-weight:700;color:#ffffff;">New website lead</div>
        <div style="font-size:10px;color:#bda06a;text-transform:uppercase;letter-spacing:2.5px;margin-top:3px;">Stephanie Shaffer, Realtor</div>
      </div>
      <div style="padding:24px 26px;color:#1f2937;font-size:15px;line-height:1.6;">
        <p style="margin:0 0 14px;"><strong style="color:#0e1e3a;">${esc(name)}</strong> reached out through your website.</p>
        ${email ? `<p style="margin:0 0 6px;">Email: <a href="mailto:${esc(email)}" style="color:#9a6a16;">${esc(email)}</a></p>` : ''}
        ${phone ? `<p style="margin:0 0 6px;">Phone: <a href="tel:${esc(phone)}" style="color:#9a6a16;">${esc(phone)}</a></p>` : ''}
        ${notes ? `<p style="margin:14px 0 0;padding:12px 14px;background:#f4f1ea;border-radius:8px;color:#374151;white-space:pre-wrap;">${esc(notes)}</p>` : ''}
        <p style="margin:18px 0 0;color:#6b7280;font-size:12px;border-top:1px solid #e7e2d6;padding-top:14px;">It is already saved in your CRM under Contacts. Reply to this email to respond to ${esc(name)} directly.</p>
      </div>
    </div>
  </body></html>`;

  try {
    const payload: Record<string, unknown> = {
      from: fromEmail,
      to,
      subject: `New website lead: ${name}`,
      text: lines.join('\n'),
      html,
    };
    if (email) payload.reply_to = email;
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendKey}` },
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
      const t = await r.text();
      console.error('[notify-lead] resend error', r.status, t.slice(0, 300));
      return json({ ok: false, error: 'send failed' });
    }
    return json({ ok: true });
  } catch (err) {
    console.error('[notify-lead] threw', err);
    return json({ ok: false, error: 'send threw' });
  }
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function json(b: unknown, status = 200): Response {
  return new Response(JSON.stringify(b), { status, headers: { 'Content-Type': 'application/json' } });
}
