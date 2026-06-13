/// <reference types="node" />

/**
 * Shared branded email shell for Stephanie's outbound mail. Matches the website
 * palette from tailwind.config.js: Coldwell Banker navy header, a warm gold
 * accent rule, and warm greige neutrals. Email-safe: table layout, inline
 * styles, web-safe fonts (Georgia echoes the site's Fraunces display face),
 * and a text header so nothing depends on a remote image loading.
 *
 * Underscore-prefixed so Vercel treats it as a helper, not an API route. Import
 * it from the /api functions that send mail.
 */

export const BRAND = {
  navy: '#0e1e3a',     // midnight-900
  gold: '#bd8717',     // flame-500
  goldLight: '#ddb95c', // flame-300
  cream: '#faf8f5',    // silver-50
  border: '#e7e0d6',   // silver-200
  body: '#2e2922',     // silver-800
  muted: '#7e7363',    // silver-500
};

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Wrap caller-built body markup in the branded shell. `bodyHtml` is trusted
 * markup the caller assembles, escape any user-supplied values before passing
 * them in. `title` and `preheader` are escaped here.
 */
export function brandedEmail(opts: { title: string; preheader?: string; bodyHtml: string }): string {
  const { title, preheader, bodyHtml } = opts;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:${BRAND.cream};">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>` : ''}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.cream};padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid ${BRAND.border};border-radius:14px;overflow:hidden;">
        <tr><td style="background:${BRAND.navy};border-bottom:3px solid ${BRAND.gold};padding:20px 28px;">
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:0.2px;">Stephanie Shaffer</div>
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;color:${BRAND.goldLight};text-transform:uppercase;letter-spacing:2.5px;margin-top:4px;">Realtor &middot; Coldwell Banker Schmidt Realty</div>
        </td></tr>
        <tr><td style="padding:28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:${BRAND.body};">
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:16px 28px 22px;border-top:1px solid ${BRAND.border};font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:${BRAND.muted};">
          Stephanie Shaffer, Realtor &middot; Coldwell Banker Schmidt Realty<br>
          <a href="tel:+19377285722" style="color:${BRAND.muted};text-decoration:none;">(937) 728-5722</a> &middot;
          <a href="https://www.buysellhomesohio.com" style="color:${BRAND.gold};text-decoration:none;">buysellhomesohio.com</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
