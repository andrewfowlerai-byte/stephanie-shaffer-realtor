/// <reference types="node" />
export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const apiKey = process.env.OPENAI_API_KEY ?? '';
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'OpenAI API key not configured.' }), { status: 500 });
  }

  let body: {
    contactName?: string;
    businessName?: string;
    stage?: string;
    industry?: string;
    notes?: string;
    senderName?: string;
    emailType?: 'follow_up' | 'intro' | 'proposal' | 'check_in';
  };

  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body.' }), { status: 400 });
  }

  const {
    contactName = 'there',
    businessName = '',
    stage = 'Prospect',
    industry = '',
    notes = '',
    senderName = 'Andrew',
    emailType = 'follow_up',
  } = body;

  const emailTypeGuide: Record<string, string> = {
    follow_up:  'A warm follow-up after a previous conversation. Reference the relationship and move toward next steps.',
    intro:      'A first introduction reaching out for the first time. Establish credibility and offer value quickly.',
    proposal:   'A proposal or pitch email. Clear value proposition, specific outcomes, soft call to action.',
    check_in:   'A relationship check-in. Casual, genuine, not pushy. Just staying in touch and adding value.',
  };

  const context = [
    businessName && `Business: ${businessName}`,
    industry && `Industry: ${industry}`,
    stage && `Pipeline stage: ${stage}`,
    notes && `Context / notes: ${notes}`,
  ].filter(Boolean).join('\n');

  const prompt = `You are a professional business development email writer for a social media marketing consultant named ${senderName}.

Draft a ${emailType.replace('_', ' ')} email to ${contactName}${businessName ? ` at ${businessName}` : ''}.

Email type guidance: ${emailTypeGuide[emailType]}

Context about this contact:
${context || 'No additional context.'}

Requirements:
- Subject line: clear, specific, not clickbait
- Body: 3-4 short paragraphs max. Direct, warm, professional. No corporate fluff.
- CTA: one clear next step (reply, quick call, meeting)
- Signature: sign off as ${senderName}
- Sound like a real person, not a template. No "I hope this email finds you well."

Respond with ONLY valid JSON in this exact shape:
{"subject": "Subject line here", "body": "Full email body here (use \\n for line breaks)"}`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[draft-email] OpenAI error:', err);
      return new Response(JSON.stringify({ error: 'AI generation failed.' }), { status: 502 });
    }

    const data = await res.json() as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content?.trim() ?? '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON in response');

    const parsed = JSON.parse(match[0]) as { subject: string; body: string };
    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[draft-email]', err);
    return new Response(JSON.stringify({ error: 'Failed to draft email.' }), { status: 500 });
  }
}
