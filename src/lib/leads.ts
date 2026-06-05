import { supabase } from './supabase';

export interface LeadInput {
  contact_name: string;
  email?: string;
  phone?: string;
  notes?: string;
}

/**
 * Public website lead capture. Inserts straight into the shared `contacts`
 * table as a Prospect, tagged with a website source so the anon-insert RLS
 * policy accepts it. Stephanie sees it in the CRM as a new lead.
 *
 * The realtor category model (Sprint 3) will auto-apply a `Lead` tag to
 * rows where source starts with `website-`.
 */
export async function submitLead(input: LeadInput): Promise<void> {
  const { error } = await supabase.from('contacts').insert({
    contact_name: input.contact_name,
    email: input.email ?? null,
    phone: input.phone ?? null,
    notes: input.notes ?? null,
    stage: 'Prospect',
    source: 'website-contact-form',
  });
  if (error) throw error;
}
