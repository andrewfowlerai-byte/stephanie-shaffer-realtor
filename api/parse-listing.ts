/// <reference types="node" />

/**
 * Listing quick-fill. Accepts either:
 *   - { text }: listing details the user pasted (works from any source), or
 *   - { url }:  a listing URL. We best-effort fetch the public HTML and pull
 *     JSON-LD / Open Graph / visible text. Bot-protected sites (Zillow, OneHome)
 *     usually block this; we detect that and tell the user to paste instead.
 * Then OpenAI extracts structured fields. We never store remote portal images.
 */
export const config = { runtime: 'edge' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const apiKey = process.env.OPENAI_API_KEY ?? '';
  if (!apiKey) return json({ error: 'OpenAI API key not configured.' }, 500);

  let body: { url?: string; text?: string };
  try { body = await req.json(); } catch { return json({ error: 'Invalid request body.' }, 400); }

  let sourceText = (body.text ?? '').trim();
  let note: string | undefined;

  if (body.url && /^https?:\/\//i.test(body.url)) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(body.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml',
        },
        signal: controller.signal,
      });
      clearTimeout(timer);
      const html = await res.text();
      if (!res.ok || /captcha|access to this page has been denied|press & hold|are you a human|enable javascript/i.test(html)) {
        note = 'That link could not be read automatically (the site blocked it). Copy the listing details and paste them here instead.';
      } else {
        const ld = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]).join('\n');
        const og = [...html.matchAll(/<meta[^>]+property=["']og:(?:title|description)["'][^>]+content=["']([^"']+)["']/gi)].map((m) => m[1]).join(' ');
        const text = html
          .replace(/<script[\s\S]*?<\/script>/gi, ' ')
          .replace(/<style[\s\S]*?<\/style>/gi, ' ')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        sourceText = `${og}\n${ld}\n${text}`.slice(0, 6000);
      }
    } catch {
      note = 'That link could not be read automatically. Copy the listing details and paste them here instead.';
    }
  }

  if (!sourceText) {
    return json({ fields: {}, note: note ?? 'Paste a listing link or the listing details to fill the form.' });
  }

  const prompt = `Extract real estate listing fields from the content below. Respond with ONLY valid JSON in exactly this shape, using null for anything not clearly present:
{"status":"Active|Pending|Sold or null","address":"street address or null","city":"City, ST or null","price":number or null,"beds":number or null,"baths":number or null,"sqft":number or null,"mls":"MLS number or null","description":"a warm 1 to 2 sentence description or null"}
Rules: price, sqft, beds, and baths must be plain numbers (no $, no commas). Do not invent data. No em-dashes in the description.

Content:
${sourceText}`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'gpt-4o-mini', max_tokens: 500, messages: [{ role: 'user', content: prompt }] }),
    });
    if (!res.ok) {
      console.error('[parse-listing] OpenAI error', await res.text());
      return json({ error: 'AI parse failed.', note }, 502);
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const txt = data.choices?.[0]?.message?.content?.trim() ?? '';
    const match = txt.match(/\{[\s\S]*\}/);
    const fields = match ? JSON.parse(match[0]) : {};
    return json({ fields, note });
  } catch (err) {
    console.error('[parse-listing]', err);
    return json({ error: 'Failed to parse the listing.', note }, 500);
  }
}

function json(b: unknown, status = 200): Response {
  return new Response(JSON.stringify(b), { status, headers: { 'Content-Type': 'application/json' } });
}
