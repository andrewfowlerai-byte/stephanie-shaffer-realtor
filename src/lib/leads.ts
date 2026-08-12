import { supabase } from './supabase';

export interface LeadInput {
  contact_name: string;
  email?: string;
  phone?: string;
  notes?: string;
  /** Honeypot: hidden field real users leave empty. Bots fill it. */
  hp?: string;
  /** Milliseconds the visitor spent on the form before submitting. */
  elapsedMs?: number;
}

/**
 * Public website lead capture. Posts to the guarded /api/submit-lead endpoint,
 * which runs all anti-spam server-side (honeypot, submit timer, origin, content)
 * and then saves + emails. Spam is dropped there before anything is stored.
 *
 * If the endpoint reports it could not store the lead (service role not yet
 * configured, or a transient error), we fall back to the legacy anon insert so
 * a real lead is never lost during rollout.
 */
export async function submitLead(input: LeadInput): Promise<void> {
  try {
    const res = await fetch('/api/submit-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contact_name: input.contact_name,
        email: input.email,
        phone: input.phone,
        notes: input.notes,
        hp: input.hp ?? '',
        elapsedMs: input.elapsedMs ?? 0,
      }),
    });
    if (res.ok) {
      const data = (await res.json().catch(() => ({}))) as { store?: string };
      // Handled server-side (dropped as spam, or saved). Nothing more to do.
      if (data.store !== 'client') return;
      // Endpoint asked us to store it (service role not configured yet).
      await directInsert(input);
      return;
    }
    // Unexpected endpoint error: don't lose the lead.
    await directInsert(input);
  } catch {
    // Network error reaching the endpoint: fall back so the lead is captured.
    await directInsert(input);
  }
}

/**
 * Legacy fallback: insert straight into `contacts` as the anon role. Used only
 * when the server endpoint cannot store the lead. Kept resilient to the
 * categories column not existing yet (migration 0002).
 */
async function directInsert(input: LeadInput): Promise<void> {
  const base = {
    contact_name: input.contact_name,
    email: input.email ?? null,
    phone: input.phone ?? null,
    notes: input.notes ?? null,
    stage: 'Prospect',
    source: 'website-contact-form',
  };
  let { error } = await supabase.from('contacts').insert({ ...base, categories: ['Lead'] });
  if (error && error.code === '42703') {
    ({ error } = await supabase.from('contacts').insert(base));
  }
  if (error) {
    console.error('[submitLead] fallback insert failed', error);
    throw new Error([error.message, error.details, error.hint, error.code].filter(Boolean).join(' | '));
  }
}
