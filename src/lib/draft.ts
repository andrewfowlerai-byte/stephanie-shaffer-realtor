import type { DraftType } from './followups';

export type DraftChannel = 'email' | 'text';

export interface DraftRequest {
  channel: DraftChannel;
  draftType: DraftType | 'intro';
  contactName: string;
  senderName?: string;   // defaults to Stephanie server-side
  context?: string;      // why we are reaching out (occasion, their search, area)
  notes?: string;        // freeform contact notes
}

export interface DraftResult {
  subject?: string;      // email only
  body: string;
}

/** Calls the AI draft endpoint and returns a subject (email) + body in Stephanie's voice. */
export async function generateDraft(req: DraftRequest): Promise<DraftResult> {
  const res = await fetch('/api/draft-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  const data = (await res.json()) as { subject?: string; body?: string; error?: string };
  if (!res.ok || data.error) throw new Error(data.error ?? 'Failed to generate a draft.');
  return { subject: data.subject, body: data.body ?? '' };
}
