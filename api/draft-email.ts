/// <reference types="node" />

/**
 * AI message drafting for the realtor CRM. Writes in a warm, professional,
 * locally rooted voice. Supports two channels:
 *   - email: returns { subject, body }
 *   - text:  returns { body } only (short, conversational)
 *
 * draftType sets the tone: birthday, anniversary (home), check_in, follow_up, intro.
 */
export const config = { runtime: 'edge' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const apiKey = process.env.OPENAI_API_KEY ?? '';
  if (!apiKey) return json({ error: 'OpenAI API key not configured.' }, 500);

  let body: {
    channel?: 'email' | 'text';
    draftType?: 'birthday' | 'anniversary' | 'check_in' | 'follow_up' | 'intro';
    contactName?: string;
    senderName?: string;
    context?: string;
    notes?: string;
  };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid request body.' }, 400);
  }

  const {
    channel = 'email',
    draftType = 'check_in',
    contactName = 'there',
    senderName = 'Stephanie',
    context = '',
    notes = '',
  } = body;

  const toneGuide: Record<string, string> = {
    birthday:    'Wish them a happy birthday. Warm and personal. No business talk and no ask.',
    anniversary: 'Congratulate them on the anniversary of buying their home. Warm and celebratory, with no ask.',
    check_in:    'A genuine check-in. Friendly, no pressure. You can offer to help if they ever need anything.',
    follow_up:   'A gentle follow-up that references you have been in touch. Light and helpful, with one soft next step.',
    intro:       'A warm first hello. Friendly, let them know you are here to help, low pressure.',
  };

  const extra = [
    context && `Why you are reaching out: ${context}`,
    notes && `Notes about this person: ${notes}`,
  ].filter(Boolean).join('\n');

  const shared = `You are ${senderName}, a warm, professional, locally rooted real estate agent.
Write to ${contactName}.

Tone for this message: ${toneGuide[draftType] ?? toneGuide.check_in}
${extra ? `\n${extra}\n` : ''}
Hard rules:
- Sound like a real person, never a template. Do not write "I hope this email finds you well."
- Never use em-dashes or en-dashes. Use periods, commas, colons, or parentheses.
- Warm and genuine, never pushy or salesy.`;

  const prompt = channel === 'text'
    ? `${shared}

Write a SHORT text message (1 to 3 sentences, under 320 characters). Conversational, like a real text. You may end with "- ${senderName}" but no subject line.

Respond with ONLY valid JSON in this exact shape:
{"body": "the text message"}`
    : `${shared}

Write a short email: a clear subject line and 2 to 3 short paragraphs. Sign off as ${senderName}.

Respond with ONLY valid JSON in this exact shape:
{"subject": "subject line", "body": "email body (use \\n for line breaks)"}`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) {
      console.error('[draft-email] OpenAI error:', await res.text());
      return json({ error: 'AI generation failed.' }, 502);
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content?.trim() ?? '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON in response');
    const parsed = JSON.parse(match[0]) as { subject?: string; body: string };
    return json(channel === 'text' ? { body: parsed.body } : { subject: parsed.subject ?? '', body: parsed.body });
  } catch (err) {
    console.error('[draft-email]', err);
    return json({ error: 'Failed to draft the message.' }, 500);
  }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}
